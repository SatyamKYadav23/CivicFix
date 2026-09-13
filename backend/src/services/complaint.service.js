const complaintRepository = require('../repositories/complaint.repository');
const historyRepository = require('../repositories/history.repository');
const notificationService = require('./notification.service');
const stateMachineService = require('./stateMachine.service');
const storageService = require('./storage');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');
const { matchesJurisdiction } = require('./jurisdiction.helper');

/**
 * Format complaint with UI-compatible fields (timeline, resolution, feedback, photos)
 */
function formatComplaintOutput(complaint) {
  if (!complaint) return null;

  const history = complaint.history || [];
  const timeline = history.map((h) => {
    let title = h.action;
    if (h.action === 'CREATED') title = 'Complaint Reported';
    else if (h.action === 'TASK_ACCEPTED') title = 'Task Accepted by Technician';
    else if (h.action === 'STATUS_CHANGE') title = `Status Changed to ${h.toStatus}`;
    else if (h.action === 'ASSIGN_WORKER') title = `Assigned to ${complaint.assignedWorker?.name || 'Technician'}`;
    else if (h.action === 'WORK_UPDATE') title = 'Progress Update Logged';
    else if (h.action === 'EVIDENCE_UPLOAD') title = 'Resolution Proof Uploaded';
    else if (h.action === 'FEEDBACK_SUBMITTED') title = 'Closed with Citizen Rating';

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

  // Combine citizen reported photo with resolution proof photos so consumers always see evidence
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
 * Complaint Service - Core Business Logic Layer
 */
class ComplaintService {

  /**
   * Create a new complaint
   * @param {object} user - Authenticated user from JWT
   * @param {object} payload - Validated request body
   * @param {object} [file] - Multer uploaded file
   */
  async createComplaint(user, payload, file = null) {
    let imageUrl = payload.imageUrl ? payload.imageUrl.trim() : null;
    let imagePublicId = null;
    let evidenceMeta = null;

    if (file) {
      const evidence = await storageService.upload(file);
      imageUrl = evidence.url;
      imagePublicId = evidence.publicId;
      evidenceMeta = {
        originalName: evidence.originalName,
        mimeType: evidence.mimeType,
        size: evidence.size,
        uploadedAt: evidence.uploadedAt,
      };
    }

    const latitude =
      payload.latitude !== undefined && payload.latitude !== null && `${payload.latitude}`.trim() !== ''
        ? Number(payload.latitude)
        : null;

    const longitude =
      payload.longitude !== undefined && payload.longitude !== null && `${payload.longitude}`.trim() !== ''
        ? Number(payload.longitude)
        : null;

    const complaintData = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category.toUpperCase(),
      priority: payload.priority ? payload.priority.toUpperCase() : 'MEDIUM',
      status: 'SUBMITTED',
      location: payload.location.trim(),
      latitude,
      longitude,
      imageUrl,
      imagePublicId,
      evidenceMeta,
      citizenId: user.id, // Strictly enforce authenticated user ID
    };

    const created = await complaintRepository.create(complaintData);

    // Record initial history entry
    await historyRepository.create({
      complaintId: created.id,
      fromStatus: null,
      toStatus: 'SUBMITTED',
      action: 'CREATED',
      notes: 'Complaint reported by citizen',
      actorId: user.id,
    });

    // Notify citizen and authorities of new complaint
    await notificationService.notifyComplaintCreated(created, user);

    const refreshed = await complaintRepository.findById(created.id);
    return formatComplaintOutput(refreshed);
  }


  /**
   * Retrieve complaints with role-based scoping, filtering, pagination, and sorting
   * @param {object} user - Authenticated user from JWT
   * @param {object} query - Query parameters
   */
  async getComplaints(user, query = {}) {
    const { page, limit, skip } = parsePagination(query, 10, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'category'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    const where = { ...dateRange };

    // 1. Role-Based Data Scoping
    if (user.role === 'CITIZEN') {
      // Citizens ONLY see complaints reported by themselves
      where.citizenId = user.id;
    } else if (user.role === 'WORKER') {
      // Workers see complaints assigned to them
      where.assignedWorkerId = user.id;
    }
    // AUTHORITY and ADMIN can view all complaints (or filter by query)

    // 2. Query Filters (supporting multi-value comma separated or single values)
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

    if (query.citizenId && user.role !== 'CITIZEN') {
      where.citizenId = query.citizenId;
    }

    if (query.assignedWorkerId && user.role !== 'CITIZEN') {
      where.assignedWorkerId = query.assignedWorkerId;
    }

    if (query.location && query.location.trim() !== '') {
      where.location = { contains: query.location.trim() };
    }

    // Search query on title, description, or location
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { location: { contains: searchTerm } },
      ];
    }

    // 3. Query execution
    const [complaints, total] = await Promise.all([
      complaintRepository.findMany({ where, skip, take: limit, orderBy }),
      complaintRepository.count(where),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return {
      complaints: complaints.map(formatComplaintOutput),
      pagination,
    };
  }

  /**
   * Retrieve a single complaint by ID with ownership verification
   * @param {object} user - Authenticated user from JWT
   * @param {string} id - Complaint primary key ID
   */
  async getComplaintById(user, id) {
    const complaint = await complaintRepository.findById(id);

    if (!complaint) {
      throw new AppError(`Complaint not found with ID: ${id}`, 404);
    }

    // Role-based authorization & IDOR defense
    if (user.role === 'CITIZEN' && complaint.citizenId !== user.id) {
      throw new AppError('Access denied. You can only view your own complaints.', 403);
    }

    if (user.role === 'WORKER' && complaint.assignedWorkerId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Access denied. You can only view complaints assigned to you.', 403);
    }

    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department) && user.role !== 'ADMIN') {
      throw new AppError(`Access denied. You do not have jurisdiction over ${complaint.category} complaints.`, 403);
    }

    return formatComplaintOutput(complaint);
  }

  /**
   * Update complaint information with role-based field restrictions
   * @param {object} user - Authenticated user from JWT
   * @param {string} id - Complaint primary key ID
   * @param {object} payload - Update fields
   * @param {object} [file] - Multer uploaded file
   */
  async updateComplaint(user, id, payload, file = null) {
    const complaint = await complaintRepository.findById(id);

    if (!complaint) {
      throw new AppError(`Complaint not found with ID: ${id}`, 404);
    }

    const updateData = {};

    // Process new file upload if provided
    if (file) {
      const evidence = await storageService.upload(file);
      updateData.imageUrl = evidence.url;
      updateData.imagePublicId = evidence.publicId;
      updateData.evidenceMeta = {
        originalName: evidence.originalName,
        mimeType: evidence.mimeType,
        size: evidence.size,
        uploadedAt: evidence.uploadedAt,
      };
    }

    // 1. Citizen updating their own complaint
    if (user.role === 'CITIZEN') {
      if (complaint.citizenId !== user.id) {
        throw new AppError('Access denied. You can only modify your own complaints.', 403);
      }

      if (payload.status) {
        const newStatus = payload.status.toUpperCase();
        if (newStatus !== complaint.status) {
          stateMachineService.validateTransition(complaint, newStatus, user);
          updateData.status = newStatus;
          if (newStatus === 'RESOLVED' && complaint.status !== 'RESOLVED') {
            updateData.resolvedAt = new Date();
          }
        }
      }

      const hasContentChanges =
        payload.title !== undefined ||
        payload.description !== undefined ||
        payload.category !== undefined ||
        payload.location !== undefined ||
        payload.latitude !== undefined ||
        payload.longitude !== undefined ||
        Boolean(file);

      // Citizens can only edit complaint content if complaint is still in early stage
      if (hasContentChanges && !['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status)) {
        throw new AppError(
          `Cannot edit complaint details when currently in '${complaint.status}' status.`,
          400
        );
      }

      // Allowed fields for Citizen
      if (payload.title) updateData.title = payload.title.trim();
      if (payload.description) updateData.description = payload.description.trim();
      if (payload.category) updateData.category = payload.category.toUpperCase();
      if (payload.location) updateData.location = payload.location.trim();
      if (payload.latitude !== undefined && payload.latitude !== null && `${payload.latitude}`.trim() !== '') {
        updateData.latitude = Number(payload.latitude);
      }
      if (payload.longitude !== undefined && payload.longitude !== null && `${payload.longitude}`.trim() !== '') {
        updateData.longitude = Number(payload.longitude);
      }
      if (payload.imageUrl !== undefined && !file) updateData.imageUrl = payload.imageUrl;
    }
    // 2. Authority or Admin updating complaint
    else if (['AUTHORITY', 'ADMIN'].includes(user.role)) {
      if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department)) {
        throw new AppError(`Access denied. You do not have jurisdiction over ${complaint.category} complaints.`, 403);
      }

      if (payload.title) updateData.title = payload.title.trim();
      if (payload.description) updateData.description = payload.description.trim();
      if (payload.category) updateData.category = payload.category.toUpperCase();
      if (payload.location) updateData.location = payload.location.trim();
      if (payload.priority) updateData.priority = payload.priority.toUpperCase();
      if (payload.assignedWorkerId !== undefined) updateData.assignedWorkerId = payload.assignedWorkerId;
      if (payload.assignedAuthorityId !== undefined) updateData.assignedAuthorityId = payload.assignedAuthorityId;
      if (payload.latitude !== undefined && payload.latitude !== null && `${payload.latitude}`.trim() !== '') {
        updateData.latitude = Number(payload.latitude);
      }
      if (payload.longitude !== undefined && payload.longitude !== null && `${payload.longitude}`.trim() !== '') {
        updateData.longitude = Number(payload.longitude);
      }
      if (payload.imageUrl !== undefined && !file) updateData.imageUrl = payload.imageUrl;

      if (payload.status) {
        const newStatus = payload.status.toUpperCase();
        if (newStatus !== complaint.status) {
          stateMachineService.validateTransition(complaint, newStatus, user);
        }
        updateData.status = newStatus;
        if (newStatus === 'RESOLVED' && complaint.status !== 'RESOLVED') {
          updateData.resolvedAt = new Date();
        }
      }
    }
    // 3. Worker updating assigned task
    else if (user.role === 'WORKER') {
      if (complaint.assignedWorkerId !== user.id && user.role !== 'ADMIN') {
        throw new AppError('Access denied. You can only update tasks assigned to you.', 403);
      }

      if (payload.status) {
        const newStatus = payload.status.toUpperCase();
        if (newStatus !== complaint.status) {
          stateMachineService.validateTransition(complaint, newStatus, user);
        }
        updateData.status = newStatus;
        if (newStatus === 'RESOLVED' && complaint.status !== 'RESOLVED') {
          updateData.resolvedAt = new Date();
        }
      }
    }

    const updated = await complaintRepository.update(id, updateData);

    if (updateData.status && updateData.status !== complaint.status) {
      await historyRepository.create({
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: updateData.status,
        action: 'STATUS_CHANGE',
        notes: payload.notes || `Status changed to ${updateData.status} by ${user.name}`,
        actorId: user.id,
      });

      if (updateData.status === 'RESOLVED') {
        await notificationService.notifyComplaintResolved(updated, user);
      } else if (updateData.status === 'REOPENED') {
        await notificationService.notifyComplaintReopened(updated, user, payload.notes);
      } else if (updateData.status === 'REJECTED') {
        await notificationService.notifyComplaintRejected(updated, payload.notes, user);
      } else {
        await notificationService.notifyStatusChanged(updated, updateData.status, user, payload.notes);
      }
    }

    const refreshed = await complaintRepository.findById(id);
    return formatComplaintOutput(refreshed);
  }

  /**
   * Submit citizen satisfaction feedback and close complaint
   * @param {object} user - Authenticated user from JWT
   * @param {string} id - Complaint primary key ID
   * @param {object} payload - { rating, comment }
   */
  async submitFeedback(user, id, payload) {
    const complaint = await complaintRepository.findById(id);

    if (!complaint) {
      throw new AppError(`Complaint not found with ID: ${id}`, 404);
    }

    // Must be reported by this citizen
    if (complaint.citizenId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Access denied: You can only submit feedback for your own complaints', 403);
    }

    // Must be in RESOLVED status
    if (complaint.status !== 'RESOLVED') {
      throw new AppError(
        `Feedback can only be submitted for RESOLVED complaints. Current status is '${complaint.status}'.`,
        400
      );
    }

    const { rating, comment } = payload;
    const numRating = parseInt(rating, 10);

    const feedbackData = {
      rating: numRating,
      comment: comment ? comment.trim() : null,
      citizenName: user.name,
      citizenId: user.id,
      createdAt: new Date().toISOString(),
    };

    // Transition status to CLOSED upon feedback
    await complaintRepository.update(id, {
      feedback: feedbackData,
      status: 'CLOSED',
    });

    // Record history
    await historyRepository.create({
      complaintId: id,
      fromStatus: 'RESOLVED',
      toStatus: 'CLOSED',
      action: 'FEEDBACK_SUBMITTED',
      notes: comment
        ? `Rated ${numRating}/5 stars: "${comment.trim()}"`
        : `Rated ${numRating}/5 stars by citizen`,
      actorId: user.id,
    });

    const refreshed = await complaintRepository.findById(id);

    // Notify authority and worker with rating and comment
    await notificationService.notifyFeedbackSubmitted(refreshed, numRating, user, comment);

    return formatComplaintOutput(refreshed);
  }

  /**
   * Get chronological timeline for complaint
   * @param {object} user - Authenticated user from JWT
   * @param {string} id - Complaint primary key ID
   */
  async getComplaintTimeline(user, id) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Complaint with ID ${id} not found`, 404);
    }

    // Role-based visibility check
    if (user.role === 'CITIZEN' && complaint.citizenId !== user.id) {
      throw new AppError('Access denied: You can only view timeline for your own complaints.', 403);
    }
    if (user.role === 'WORKER' && complaint.assignedWorkerId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Access denied: You can only view timeline for assigned tasks.', 403);
    }
    if (user.role === 'AUTHORITY' && !matchesJurisdiction(complaint.category, user.department) && user.role !== 'ADMIN') {
      throw new AppError(`Access denied: You do not have jurisdiction over ${complaint.category} complaints.`, 403);
    }

    const formatted = formatComplaintOutput(complaint);
    return {
      complaintId: complaint.id,
      title: complaint.title,
      currentStatus: complaint.status,
      timeline: formatted.timeline,
      history: complaint.history,
    };
  }



  /**
   * Delete or cancel a complaint
   * @param {object} user - Authenticated user from JWT
   * @param {string} id - Complaint primary key ID
   */
  async deleteComplaint(user, id) {
    const complaint = await complaintRepository.findById(id);

    if (!complaint) {
      throw new AppError(`Complaint not found with ID: ${id}`, 404);
    }

    // Citizens can only cancel their own complaints in early stage
    if (user.role === 'CITIZEN') {
      if (complaint.citizenId !== user.id) {
        throw new AppError('Access denied. You can only delete your own complaints.', 403);
      }

      if (!['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status)) {
        throw new AppError(
          `Cannot cancel or delete complaint that is already in '${complaint.status}' status.`,
          400
        );
      }
    } else if (user.role !== 'ADMIN') {
      // Only Citizens (their own) and Admins can delete
      throw new AppError('Access denied. Only Admins or complaint owners can delete complaints.', 403);
    }

    await complaintRepository.delete(id);

    return {
      id,
      deleted: true,
      message: 'Complaint deleted successfully.',
    };
  }
}

const complaintService = new ComplaintService();
complaintService.formatComplaintOutput = formatComplaintOutput;

module.exports = complaintService;

