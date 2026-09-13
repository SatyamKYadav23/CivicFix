const adminRepository = require('../repositories/admin.repository');
const userRepository = require('../repositories/user.repository');
const complaintRepository = require('../repositories/complaint.repository');
const historyRepository = require('../repositories/history.repository');
const notificationService = require('./notification.service');
const { CATEGORY_MAP, matchesJurisdiction } = require('./jurisdiction.helper');
const { formatComplaintOutput } = require('./complaint.service');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Admin Service - Centralized Administration Business Logic
 */
class AdminService {
  // =========================================================================
  // USER MANAGEMENT
  // =========================================================================

  /**
   * List users with search, role, status filtering and pagination
   */
  async listUsers(query = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'updatedAt', 'name', 'email', 'role', 'status', 'department'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    if (query.role && query.role !== 'ALL') {
      const roles = parseMultiEnum(query.role);
      if (roles && roles.length > 0) {
        where.role = roles.length === 1 ? roles[0] : { in: roles };
      }
    }

    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    if (query.department && query.department !== 'ALL') {
      where.department = { contains: query.department.trim() };
    }

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { department: { contains: q } },
        { zone: { contains: q } },
      ];
    }

    const [users, total] = await Promise.all([
      userRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      userRepository.count(where),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      users: users.map(sanitizeUser),
      pagination,
    };
  }

  /**
   * Get single user details by ID with activity summary
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        workerProfile: true,
        _count: {
          select: {
            reportedComplaints: true,
            assignedTasks: true,
            managedComplaints: true,
            workerAssignments: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(`User with ID ${id} not found`, 404);
    }

    return sanitizeUser(user);
  }

  /**
   * Activate or deactivate a user
   */
  async updateUserStatus(adminUser, targetUserId, { status, reason }) {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError(`User with ID ${targetUserId} not found`, 404);
    }

    const normStatus = status.toUpperCase();

    // Prevent administrator from deactivating self
    if (adminUser.id === targetUserId && normStatus === 'INACTIVE') {
      throw new AppError('Administrators cannot deactivate their own account.', 400);
    }

    const previousStatus = targetUser.status;
    const updatedUser = await userRepository.update(targetUserId, {
      status: normStatus,
    });

    // Record administrative audit log
    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'USER_STATUS_CHANGE',
      targetType: 'USER',
      targetId: targetUserId,
      details: {
        targetName: targetUser.name,
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        previousStatus,
        newStatus: normStatus,
        reason: reason || 'Administrative action',
      },
    });

    return sanitizeUser(updatedUser);
  }

  /**
   * Change user role and departmental assignment
   */
  async updateUserRole(adminUser, targetUserId, { role, department, designation, zone, reason }) {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError(`User with ID ${targetUserId} not found`, 404);
    }

    const normRole = role.toUpperCase();

    // Prevent administrator from demoting self from ADMIN
    if (adminUser.id === targetUserId && normRole !== 'ADMIN') {
      throw new AppError('Administrators cannot demote their own role from ADMIN.', 400);
    }

    const previousRole = targetUser.role;
    const updateData = {
      role: normRole,
    };

    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (designation !== undefined) updateData.designation = designation ? designation.trim() : null;
    if (zone !== undefined) updateData.zone = zone ? zone.trim() : null;

    // If changing to WORKER, ensure WorkerProfile exists
    if (normRole === 'WORKER') {
      await prisma.workerProfile.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          department: updateData.department || targetUser.department || 'General Maintenance',
          isAvailable: true,
        },
        update: {
          department: updateData.department || undefined,
        },
      });
    }

    const updatedUser = await userRepository.update(targetUserId, updateData);

    // Record audit log
    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'USER_ROLE_CHANGE',
      targetType: 'USER',
      targetId: targetUserId,
      details: {
        targetName: targetUser.name,
        targetEmail: targetUser.email,
        previousRole,
        newRole: normRole,
        department: updateData.department,
        reason: reason || 'Administrative role change',
      },
    });

    return sanitizeUser(updatedUser);
  }

  /**
   * Create an administrative, authority, or worker user
   */
  async createUser(adminUser, userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new AppError(`A user with email ${userData.email} already exists.`, 409);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const normRole = userData.role.toUpperCase();

    const created = await userRepository.create({
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: userData.phone ? userData.phone.trim() : null,
      role: normRole,
      status: userData.status ? userData.status.toUpperCase() : 'ACTIVE',
      department: userData.department ? userData.department.trim() : null,
      zone: userData.zone ? userData.zone.trim() : null,
      designation: userData.designation ? userData.designation.trim() : null,
      address: userData.address ? userData.address.trim() : null,
    });

    if (normRole === 'WORKER') {
      await prisma.workerProfile.create({
        data: {
          userId: created.id,
          department: created.department || 'Field Division',
          skills: userData.skills ? userData.skills.trim() : '',
          isAvailable: true,
        },
      });
    }

    // Record audit log
    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'USER_CREATE',
      targetType: 'USER',
      targetId: created.id,
      details: {
        name: created.name,
        email: created.email,
        role: created.role,
        department: created.department,
      },
    });

    return sanitizeUser(created);
  }

  // =========================================================================
  // COMPLAINT MANAGEMENT
  // =========================================================================

  /**
   * System-wide global complaint search and listing
   */
  async listComplaints(query = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'category'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    if (query.category && query.category !== 'ALL') {
      const categories = parseMultiEnum(query.category);
      if (categories && categories.length > 0) {
        where.category = categories.length === 1 ? categories[0] : { in: categories };
      }
    }

    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    if (query.priority && query.priority !== 'ALL') {
      const priorities = parseMultiEnum(query.priority);
      if (priorities && priorities.length > 0) {
        where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
      }
    }

    if (query.citizenId) where.citizenId = query.citizenId;
    if (query.assignedWorkerId) where.assignedWorkerId = query.assignedWorkerId;
    if (query.assignedAuthorityId) where.assignedAuthorityId = query.assignedAuthorityId;

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const [complaints, total] = await Promise.all([
      complaintRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      complaintRepository.count(where),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      complaints: complaints.map(formatComplaintOutput),
      pagination,
    };
  }

  /**
   * Get complete complaint details
   */
  async getComplaintDetails(id) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }
    return formatComplaintOutput(complaint);
  }

  /**
   * Get complaint history audit trail
   */
  async getComplaintHistory(id) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }
    return historyRepository.findByComplaintId(id);
  }

  /**
   * Administrative override of complaint status
   */
  async overrideComplaintStatus(adminUser, complaintId, { status, notes }) {
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${complaintId} not found`, 404);
    }

    const normStatus = status.toUpperCase();
    const fromStatus = complaint.status;

    const updateData = { status: normStatus };
    if (normStatus === 'RESOLVED' && fromStatus !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await complaintRepository.update(complaintId, updateData);

    // 1. Record ComplaintHistory
    await historyRepository.create({
      complaintId,
      fromStatus,
      toStatus: normStatus,
      action: 'ADMIN_OVERRIDE',
      notes: notes || `Status changed from ${fromStatus} to ${normStatus} by Admin (${adminUser.name})`,
      actorId: adminUser.id,
    });

    // 2. Record Admin AuditLog
    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'COMPLAINT_STATUS_OVERRIDE',
      targetType: 'COMPLAINT',
      targetId: complaintId,
      details: {
        title: complaint.title,
        fromStatus,
        toStatus: normStatus,
        notes,
      },
    });

    // 3. Dispatch notifications
    if (normStatus === 'RESOLVED') {
      await notificationService.notifyComplaintResolved(updated, adminUser);
    } else if (normStatus === 'REJECTED') {
      await notificationService.notifyComplaintRejected(updated, notes, adminUser);
    } else if (normStatus === 'REOPENED') {
      await notificationService.notifyComplaintReopened(updated, adminUser, notes);
    } else {
      await notificationService.notifyStatusChanged(updated, normStatus, adminUser, notes);
    }

    const refreshed = await complaintRepository.findById(complaintId);
    return formatComplaintOutput(refreshed);
  }

  /**
   * Administrative override of complaint priority
   */
  async overrideComplaintPriority(adminUser, complaintId, { priority, notes }) {
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${complaintId} not found`, 404);
    }

    const normPriority = priority.toUpperCase();
    const fromPriority = complaint.priority;

    await complaintRepository.update(complaintId, { priority: normPriority });

    await historyRepository.create({
      complaintId,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      action: 'PRIORITY_CHANGE',
      notes: notes || `Priority adjusted from ${fromPriority} to ${normPriority} by Admin`,
      actorId: adminUser.id,
    });

    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'COMPLAINT_PRIORITY_OVERRIDE',
      targetType: 'COMPLAINT',
      targetId: complaintId,
      details: {
        title: complaint.title,
        fromPriority,
        toPriority: normPriority,
        notes,
      },
    });

    const refreshed = await complaintRepository.findById(complaintId);
    return formatComplaintOutput(refreshed);
  }

  /**
   * Administrative deletion of a complaint
   */
  async deleteComplaint(adminUser, complaintId, { reason } = {}) {
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${complaintId} not found`, 404);
    }

    await complaintRepository.delete(complaintId);

    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'COMPLAINT_DELETE',
      targetType: 'COMPLAINT',
      targetId: complaintId,
      details: {
        title: complaint.title,
        category: complaint.category,
        citizenId: complaint.citizenId,
        reason: reason || 'Purged by Administrator',
      },
    });

    return { success: true, message: 'Complaint permanently deleted' };
  }

  // =========================================================================
  // WORKER MANAGEMENT
  // =========================================================================

  /**
   * List technicians with calculated workload metrics
   */
  async listWorkers(query = {}) {
    const { page, limit, skip } = parsePagination(query, 50, 100);
    const { orderBy } = parseSorting(
      query,
      ['name', 'email', 'status', 'department', 'createdAt'],
      'name',
      'asc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    let statusFilter = undefined;
    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        statusFilter = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    const { workers, total } = await adminRepository.getWorkersWorkload({
      ...query,
      status: statusFilter,
      dateRange,
      orderBy,
      skip,
      take: limit,
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      workers,
      pagination,
    };
  }

  /**
   * Toggle worker availability and active status
   */
  async updateWorkerStatus(adminUser, workerId, { isAvailable, status, reason }) {
    const worker = await userRepository.findById(workerId);
    if (!worker || worker.role !== 'WORKER') {
      throw new AppError(`Field technician with ID ${workerId} not found`, 404);
    }

    const updates = {};
    if (status) {
      updates.status = status.toUpperCase();
      await userRepository.update(workerId, { status: updates.status });
    }

    if (typeof isAvailable === 'boolean') {
      updates.isAvailable = isAvailable;
      await prisma.workerProfile.upsert({
        where: { userId: workerId },
        create: {
          userId: workerId,
          department: worker.department || 'Field Division',
          isAvailable,
        },
        update: { isAvailable },
      });
    }

    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'WORKER_STATUS_CHANGE',
      targetType: 'WORKER',
      targetId: workerId,
      details: {
        workerName: worker.name,
        updates,
        reason: reason || 'Administrative worker status update',
      },
    });

    const refreshed = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true },
    });

    return sanitizeUser(refreshed);
  }

  /**
   * Update worker profile metadata
   */
  async updateWorkerProfile(adminUser, workerId, payload = {}) {
    const worker = await userRepository.findById(workerId);
    if (!worker || worker.role !== 'WORKER') {
      throw new AppError(`Field technician with ID ${workerId} not found`, 404);
    }

    const profileData = {};
    if (payload.skills !== undefined) profileData.skills = payload.skills;
    if (payload.vehicleNumber !== undefined) profileData.vehicleNumber = payload.vehicleNumber;
    if (payload.currentZone !== undefined) profileData.currentZone = payload.currentZone;
    if (payload.isAvailable !== undefined) profileData.isAvailable = Boolean(payload.isAvailable);

    if (payload.department) {
      profileData.department = payload.department.trim();
      await userRepository.update(workerId, { department: payload.department.trim() });
    }

    await prisma.workerProfile.upsert({
      where: { userId: workerId },
      create: {
        userId: workerId,
        department: worker.department || 'Field Division',
        ...profileData,
      },
      update: profileData,
    });

    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'WORKER_PROFILE_UPDATE',
      targetType: 'WORKER',
      targetId: workerId,
      details: {
        workerName: worker.name,
        profileData,
      },
    });

    const refreshed = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true },
    });

    return sanitizeUser(refreshed);
  }

  // =========================================================================
  // AUTHORITY MANAGEMENT
  // =========================================================================

  /**
   * List authorities with active caseload counts
   */
  async listAuthorities(query = {}) {
    const { page, limit, skip } = parsePagination(query, 50, 100);
    const { orderBy } = parseSorting(
      query,
      ['name', 'email', 'status', 'department', 'createdAt'],
      'name',
      'asc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    let statusFilter = undefined;
    if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        statusFilter = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    const { authorities, total } = await adminRepository.getAuthoritiesOverview({
      ...query,
      status: statusFilter,
      dateRange,
      orderBy,
      skip,
      take: limit,
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      authorities,
      pagination,
    };
  }

  /**
   * Update authority department, jurisdiction, or designation
   */
  async updateAuthorityJurisdiction(adminUser, authorityId, { department, zone, designation, reason }) {
    const authority = await userRepository.findById(authorityId);
    if (!authority || authority.role !== 'AUTHORITY') {
      throw new AppError(`Authority officer with ID ${authorityId} not found`, 404);
    }

    const updateData = {};
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (zone !== undefined) updateData.zone = zone ? zone.trim() : null;
    if (designation !== undefined) updateData.designation = designation ? designation.trim() : null;

    const updated = await userRepository.update(authorityId, updateData);

    await adminRepository.createAuditLog({
      actorId: adminUser.id,
      action: 'AUTHORITY_JURISDICTION_UPDATE',
      targetType: 'AUTHORITY',
      targetId: authorityId,
      details: {
        authorityName: authority.name,
        previousDepartment: authority.department,
        newDepartment: updateData.department,
        zone: updateData.zone,
        reason: reason || 'Administrative jurisdiction update',
      },
    });

    return sanitizeUser(updated);
  }

  /**
   * Get departmental coverage and category breakdown
   */
  async getDepartmentsOverview() {
    const departments = [
      {
        name: 'Roads & Infrastructure',
        coveredCategories: ['ROADS_POTHOLES'],
        keywords: CATEGORY_MAP.ROADS_POTHOLES,
      },
      {
        name: 'Electrical Division & Lights',
        coveredCategories: ['STREET_LIGHTS'],
        keywords: CATEGORY_MAP.STREET_LIGHTS,
      },
      {
        name: 'Water Supply & Leakage',
        coveredCategories: ['WATER_SUPPLY'],
        keywords: CATEGORY_MAP.WATER_SUPPLY,
      },
      {
        name: 'Sanitation & Solid Waste',
        coveredCategories: ['SANITATION_WASTE'],
        keywords: CATEGORY_MAP.SANITATION_WASTE,
      },
      {
        name: 'Drainage & Sewage Board',
        coveredCategories: ['DRAINAGE_SEWAGE'],
        keywords: CATEGORY_MAP.DRAINAGE_SEWAGE,
      },
      {
        name: 'Horticulture & Public Parks',
        coveredCategories: ['PARKS_PUBLIC_SPACES'],
        keywords: CATEGORY_MAP.PARKS_PUBLIC_SPACES,
      },
      {
        name: 'Traffic & Transport Authority',
        coveredCategories: ['PUBLIC_TRANSPORT'],
        keywords: CATEGORY_MAP.PUBLIC_TRANSPORT,
      },
      {
        name: 'Municipal Operations & Infrastructure',
        coveredCategories: ['ALL'],
        keywords: ['central', 'operations', 'general'],
      },
    ];

    return departments;
  }

  // =========================================================================
  // SYSTEM ANALYTICS & AUDIT LOGS
  // =========================================================================

  /**
   * Retrieve platform statistics dashboard metrics
   */
  async getSystemStats() {
    return adminRepository.getSystemStats();
  }

  /**
   * Retrieve immutable system audit log trail
   */
  async getAuditLogs(query = {}) {
    const { page, limit, skip } = parsePagination(query, 50, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'action', 'targetType', 'actorId'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const { logs, total } = await adminRepository.findAuditLogs({
      search: query.search,
      action: query.action,
      targetType: query.targetType,
      actorId: query.actorId,
      dateRange,
      orderBy,
      skip,
      take: limit,
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      logs,
      pagination,
    };
  }
}

module.exports = new AdminService();
