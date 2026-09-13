const complaintRepository = require('../repositories/complaint.repository');
const historyRepository = require('../repositories/history.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const userRepository = require('../repositories/user.repository');
const stateMachineService = require('./stateMachine.service');
const notificationService = require('./notification.service');
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const { sanitizeUser, sanitizeUsers } = require('../utils/userSerializer');
const { matchesJurisdiction, getCategoriesForDepartment } = require('./jurisdiction.helper');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');


/**
 * Format complaint to include UI-compatible timeline events while retaining raw history
 */
function formatComplaintWithTimeline(complaint) {
  if (!complaint) return null;

  const history = complaint.history || [];
  const timeline = history.map((h) => {
    let title = h.action;
    if (h.action === 'STATUS_CHANGE') {
      title = `Status Changed to ${h.toStatus}`;
    } else if (h.action === 'PRIORITY_CHANGE') {
      title = `Priority Escalated to ${complaint.priority}`;
    } else if (h.action === 'ASSIGN_WORKER') {
      const workerName = complaint.assignedWorker?.name || 'Technician';
      title = `Assigned to ${workerName}`;
    } else if (h.action === 'CREATED') {
      title = 'Complaint Reported';
    } else if (h.action === 'TASK_ACCEPTED') {
      title = 'Task Accepted by Technician';
    } else if (h.action === 'WORK_UPDATE') {
      title = 'Progress Update Logged';
    } else if (h.action === 'EVIDENCE_UPLOAD') {
      title = 'Resolution Proof Uploaded';
    } else if (h.action === 'FEEDBACK_SUBMITTED') {
      title = 'Closed with Citizen Rating';
    }

    return {
      id: h.id,
      status: h.toStatus || h.fromStatus || 'SUBMITTED',
      title,
      timestamp: h.createdAt,
      actor: h.actor ? `${h.actor.name} (${h.actor.role})` : 'System',
      notes: h.notes || null,
      state: 'completed',
    };
  });

  const evidence = complaint.imageUrl
    ? [
        {
          id: complaint.imagePublicId || 'citizen-evidence-1',
          url: complaint.imageUrl,
          previewUrl: complaint.imageUrl,
          name: complaint.evidenceMeta?.originalName || 'evidence.jpg',
          type: 'CITIZEN_REPORT',
        },
      ]
    : [];

  const resolutionPhotos = Array.isArray(complaint.resolutionPhotos)
    ? complaint.resolutionPhotos
    : [];

  const photos = [...evidence, ...resolutionPhotos];

  return {
    ...complaint,
    citizenName: complaint.citizen?.name || 'Citizen',
    coordinates:
      complaint.latitude && complaint.longitude
        ? { lat: complaint.latitude, lng: complaint.longitude }
        : null,
    resolution: complaint.resolvedAt
      ? { notes: complaint.resolutionNotes || 'Issue marked resolved', resolvedAt: complaint.resolvedAt }
      : null,
    photos,
    evidence,
    resolutionPhotos,
    timeline,
  };
}

/**
 * Authority Service - Domain Logic for Authority / Triage Workflow
 */
class AuthorityService {
  /**
   * List complaints accessible to the authority officer according to jurisdiction
   */
  async getComplaints(user, query = {}) {
    const { page, limit, skip } = parsePagination(query, 10, 100);
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    // 1. Jurisdiction Scoping
    if (user.role === 'AUTHORITY') {
      const allowedCategories = getCategoriesForDepartment(user.department);
      if (allowedCategories && allowedCategories.length > 0) {
        if (query.category && query.category !== 'ALL') {
          const requestedCategories = parseMultiEnum(query.category);
          const permitted = requestedCategories
            ? requestedCategories.filter((c) => allowedCategories.includes(c))
            : [];
          where.category = { in: permitted };
        } else {
          where.category = { in: allowedCategories };
        }
      } else {
        // Universal authority jurisdiction
        if (query.category && query.category !== 'ALL') {
          const categories = parseMultiEnum(query.category);
          if (categories && categories.length > 0) {
            where.category = categories.length === 1 ? categories[0] : { in: categories };
          }
        }
      }
    } else if (user.role === 'ADMIN') {
      // Admins have universal visibility
      if (query.category && query.category !== 'ALL') {
        const categories = parseMultiEnum(query.category);
        if (categories && categories.length > 0) {
          where.category = categories.length === 1 ? categories[0] : { in: categories };
        }
      }
    }

    // 2. Department query filter (e.g. from frontend dropdowns)
    if (query.authorityDepartment && query.authorityDepartment !== 'ALL') {
      const deptCategories = getCategoriesForDepartment(query.authorityDepartment);
      if (deptCategories && deptCategories.length > 0) {
        if (where.category && where.category.in) {
          where.category.in = where.category.in.filter((c) => deptCategories.includes(c));
        } else if (!where.category) {
          where.category = { in: deptCategories };
        }
      }
    }

    // 3. Status filter (supports single or comma-separated)
    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    // 4. Priority filter (supports single or comma-separated)
    if (query.priority && query.priority !== 'ALL') {
      const priorities = parseMultiEnum(query.priority);
      if (priorities && priorities.length > 0) {
        where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
      }
    }

    // 5. Worker assignment filter
    if (query.assignmentFilter === 'ASSIGNED') {
      where.assignedWorkerId = { not: null };
    } else if (query.assignmentFilter === 'UNASSIGNED') {
      where.assignedWorkerId = null;
    }

    // 6. Search filter (title, description, location, id)
    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
        { id: { contains: q } },
      ];
    }

    // 7. Sorting (supports UI aliases OLDEST, PRIORITY_DESC, TITLE_AZ and standard sortBy/sortOrder)
    let orderBy;
    if (query.sortBy === 'OLDEST') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sortBy === 'PRIORITY_DESC') {
      orderBy = { priority: 'desc' };
    } else if (query.sortBy === 'TITLE_AZ') {
      orderBy = { title: 'asc' };
    } else {
      const sorting = parseSorting(
        query,
        ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'category'],
        'createdAt',
        'desc'
      );
      orderBy = sorting.orderBy;
    }

    const [complaints, total] = await Promise.all([
      complaintRepository.findMany({ where, skip, take: limit, orderBy }),
      complaintRepository.count(where),
    ]);

    const formattedComplaints = complaints.map(formatComplaintWithTimeline);
    const pagination = buildPaginationMeta(total, page, limit);

    return {
      complaints: formattedComplaints,
      pagination,
    };
  }

  /**
   * Get single complaint by ID with jurisdiction verification
   */
  async getComplaintById(user, id) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }

    // Jurisdiction verification
    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department)) {
      throw new AppError(`Forbidden: You do not have jurisdiction over ${complaint.category} complaints`, 403);
    }

    return formatComplaintWithTimeline(complaint);
  }

  /**
   * Update complaint status and log audit history
   */
  async updateStatus(user, id, { status, notes }) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }

    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department)) {
      throw new AppError(`Forbidden: You do not have jurisdiction over ${complaint.category} complaints`, 403);
    }

    // State machine transition validation
    stateMachineService.validateTransition(complaint, status, user);

    const fromStatus = complaint.status;
    const updateData = {
      status,
    };

    if (status === 'RESOLVED' && fromStatus !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (status !== 'RESOLVED' && complaint.resolvedAt && status !== 'CLOSED') {
      updateData.resolvedAt = null;
    }

    if (!complaint.assignedAuthorityId) {
      updateData.assignedAuthorityId = user.id;
    }

    await complaintRepository.update(id, updateData);

    // Record audit history entry
    await historyRepository.create({
      complaintId: id,
      fromStatus,
      toStatus: status,
      action: 'STATUS_CHANGE',
      notes: notes || `Status updated from ${fromStatus} to ${status} by ${user.name}`,
      actorId: user.id,
    });

    const refreshed = await complaintRepository.findById(id);

    if (status === 'RESOLVED') {
      await notificationService.notifyComplaintResolved(refreshed, user);
    } else if (status === 'REJECTED') {
      await notificationService.notifyComplaintRejected(refreshed, notes, user);
    } else if (status === 'REOPENED') {
      await notificationService.notifyComplaintReopened(refreshed, user, notes);
    } else {
      await notificationService.notifyStatusChanged(refreshed, status, user, notes);
    }

    return formatComplaintWithTimeline(refreshed);
  }


  /**
   * Update complaint priority and log audit history
   */
  async updatePriority(user, id, { priority, notes }) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }

    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department)) {
      throw new AppError(`Forbidden: You do not have jurisdiction over ${complaint.category} complaints`, 403);
    }

    const oldPriority = complaint.priority;
    await complaintRepository.update(id, { priority });

    // Record audit history entry
    await historyRepository.create({
      complaintId: id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      action: 'PRIORITY_CHANGE',
      notes: notes || `Priority escalated from ${oldPriority} to ${priority} by ${user.name}`,
      actorId: user.id,
    });

    const refreshed = await complaintRepository.findById(id);
    return formatComplaintWithTimeline(refreshed);
  }

  /**
   * Assign worker to complaint and log audit history
   */
  async assignWorker(user, id, { workerId, notes }) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }

    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department)) {
      throw new AppError(`Forbidden: You do not have jurisdiction over ${complaint.category} complaints`, 403);
    }

    // Verify worker exists, is WORKER, and is active
    const worker = await userRepository.findById(workerId);
    if (!worker || worker.role !== 'WORKER') {
      throw new AppError('Invalid worker: The specified user does not exist or does not have WORKER role', 400);
    }

    if (worker.status === 'INACTIVE') {
      throw new AppError('Cannot assign an inactive worker', 400);
    }

    const fromStatus = complaint.status;
    const toStatus =
      fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW'
        ? 'ASSIGNED'
        : fromStatus;

    const updateData = {
      assignedWorkerId: worker.id,
      assignedAuthorityId: user.id,
      status: toStatus,
    };

    await complaintRepository.update(id, updateData);

    // Create Assignment tracking record
    await assignmentRepository.create({
      complaintId: id,
      workerId: worker.id,
      assignedById: user.id,
      status: 'ASSIGNED',
      instructions: notes || `Assigned to ${worker.name}`,
    });

    // Record audit history entry
    await historyRepository.create({
      complaintId: id,
      fromStatus,
      toStatus,
      action: 'ASSIGN_WORKER',
      notes: notes || `Assigned to ${worker.name} (${worker.department || 'Field Worker'}) by ${user.name}`,
      actorId: user.id,
    });


    const previousWorkerId = complaint.assignedWorkerId;
    const refreshed = await complaintRepository.findById(id);
    await notificationService.notifyWorkerAssigned(refreshed, worker, user);
    await notificationService.notifyWorkerAssigned(refreshed, worker, user, previousWorkerId);
    return formatComplaintWithTimeline(refreshed);
  }


  /**
   * Retrieve active field workers for task assignment
   */
  async getWorkers(user, query = {}) {
    const { page, limit, skip } = parsePagination(query, 50, 100);
    const { orderBy } = parseSorting(
      query,
      ['name', 'email', 'status', 'department', 'createdAt'],
      'name',
      'asc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = {
      role: 'WORKER',
      status: { not: 'INACTIVE' },
      ...dateRange,
    };

    // Scope workers to the requesting authority's department jurisdiction
    const effectiveDept =
      user.role === 'AUTHORITY' && user.department && user.department !== 'ALL' && user.department !== 'Municipal Operations & Infrastructure'
        ? user.department
        : query.department && query.department !== 'ALL'
        ? query.department
        : null;

    if (effectiveDept) {
      const deptLower = effectiveDept.toLowerCase();
      let keyword = null;
      if (deptLower.includes('light') || deptLower.includes('electr')) keyword = 'light';
      else if (deptLower.includes('water')) keyword = 'water';
      else if (deptLower.includes('road') || deptLower.includes('pothole')) keyword = 'road';
      else if (deptLower.includes('sanitat') || deptLower.includes('waste')) keyword = 'sanitat';
      else if (deptLower.includes('drain') || deptLower.includes('sewage')) keyword = 'drain';
      else if (deptLower.includes('park')) keyword = 'park';

      if (keyword) {
        where.OR = [
          { department: { contains: effectiveDept } },
          { department: { contains: keyword } },
        ];
      } else {
        where.department = { contains: effectiveDept };
      }
    }

    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { department: { contains: q } },
        { designation: { contains: q } },
      ];
    }

    const [workers, total] = await Promise.all([
      userRepository.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      userRepository.count(where),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    if (query.page !== undefined || query.limit !== undefined) {
      return {
        workers: sanitizeUsers(workers),
        pagination,
      };
    }

    return sanitizeUsers(workers);
  }

  /**
   * Register a new field technician under this authority's department
   */
  async createWorker(authorityUser, workerData) {
    const email = workerData.email ? workerData.email.toLowerCase().trim() : '';
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError(`A technician or user with email ${email} already exists.`, 409);
    }

    const rawPassword =
      workerData.password && workerData.password.trim().length >= 6
        ? workerData.password.trim()
        : 'Worker123!';

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Authority strictly assigns the worker to its own department
    const department =
      authorityUser.role === 'AUTHORITY' && authorityUser.department
        ? authorityUser.department
        : workerData.department || 'Field Operations Division';

    const zone = authorityUser.zone || workerData.zone || null;

    let skills = workerData.skills || [];
    if (typeof skills === 'string') {
      skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const created = await userRepository.create({
      name: workerData.name.trim(),
      email,
      password: hashedPassword,
      phone: workerData.phone ? workerData.phone.trim() : null,
      role: 'WORKER',
      status: 'ACTIVE',
      department,
      zone,
      designation: workerData.designation ? workerData.designation.trim() : 'Field Technician',
      skills: skills.length > 0 ? skills : ['General Maintenance'],
    });

    // Create worker profile record
    await prisma.workerProfile.create({
      data: {
        userId: created.id,
        department,
        currentZone: zone,
        skills: skills.length > 0 ? JSON.stringify(skills) : JSON.stringify(['General Maintenance']),
        isAvailable: true,
      },
    });

    return sanitizeUser(created);
  }
}

module.exports = new AuthorityService();

