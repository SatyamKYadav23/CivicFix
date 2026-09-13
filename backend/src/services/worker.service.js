const complaintRepository = require('../repositories/complaint.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const workUpdateRepository = require('../repositories/workUpdate.repository');
const historyRepository = require('../repositories/history.repository');
const stateMachineService = require('./stateMachine.service');
const notificationService = require('./notification.service');
const storageService = require('./storage');
const AppError = require('../utils/appError');
const {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
} = require('../utils/queryHelper');

/**
 * Format complaint for frontend worker interface compatibility
 */
function formatComplaintForWorker(complaint) {
  if (!complaint) return null;

  const history = complaint.history || [];
  const timeline = history.map((h) => {
    let title = h.action;
    if (h.action === 'TASK_ACCEPTED') {
      title = 'Task Accepted by Technician';
    } else if (h.action === 'STATUS_CHANGE') {
      title = `Status Changed to ${h.toStatus}`;
    } else if (h.action === 'ASSIGN_WORKER') {
      title = `Assigned to ${complaint.assignedWorker?.name || 'Technician'}`;
    } else if (h.action === 'CREATED') {
      title = 'Complaint Reported';
    } else if (h.action === 'WORK_UPDATE') {
      title = 'Progress Update Logged';
    } else if (h.action === 'EVIDENCE_UPLOAD') {
      title = 'Resolution Proof Uploaded';
    }

    return {
      id: h.id,
      status: h.toStatus || h.fromStatus || 'SUBMITTED',
      title,
      timestamp: h.createdAt,
      actor: h.actor ? `${h.actor.name} (${h.actor.role})` : 'Worker',
      notes: h.notes || null,
      state: 'completed',
    };
  });

  const evidence = complaint.imageUrl
    ? [
        {
          id: complaint.imagePublicId || 'citizen-img-1',
          url: complaint.imageUrl,
          previewUrl: complaint.imageUrl,
          name: complaint.evidenceMeta?.originalName || 'citizen_evidence.jpg',
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
    citizenEmail: complaint.citizen?.email,
    citizenPhone: complaint.citizen?.phone,
    coordinates:
      complaint.latitude && complaint.longitude
        ? { lat: complaint.latitude, lng: complaint.longitude }
        : null,
    photos,
    evidence,
    resolutionPhotos,
    timeline,
  };
}

/**
 * Worker Service - Domain Logic for Field Worker Workflow
 */
class WorkerService {
  /**
   * Retrieve complaints assigned specifically to the authenticated worker
   */
  async getAssignedComplaints(workerUser, query = {}) {
    const { page, limit, skip } = parsePagination(query, 10, 100);
    const { orderBy, sortBy, sortOrder } = parseSorting(
      query,
      ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'category'],
      'createdAt',
      'desc'
    );
    const dateRange = parseDateRange(query, 'createdAt');

    // Strict worker scoping: Workers CANNOT view other workers' tasks
    const where = {
      assignedWorkerId: workerUser.id,
      ...dateRange,
    };

    // Filter by taskStatus or tab
    if (query.statusFilter === 'PENDING_ACCEPTANCE') {
      where.status = 'ASSIGNED';
      where.OR = [{ taskStatus: null }, { taskStatus: { not: 'ACCEPTED' } }];
    } else if (query.statusFilter === 'ACTIVE') {
      where.OR = [
        { status: 'ASSIGNED', taskStatus: 'ACCEPTED' },
        { status: 'IN_PROGRESS' },
      ];
    } else if (query.statusFilter === 'COMPLETED') {
      where.status = { in: ['RESOLVED', 'CLOSED'] };
    } else if (query.status && query.status !== 'ALL') {
      const statuses = parseMultiEnum(query.status);
      if (statuses && statuses.length > 0) {
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }
    }

    // Category filter
    if (query.category && query.category !== 'ALL') {
      const categories = parseMultiEnum(query.category);
      if (categories && categories.length > 0) {
        where.category = categories.length === 1 ? categories[0] : { in: categories };
      }
    }

    // Priority filter
    if (query.priority && query.priority !== 'ALL') {
      const priorities = parseMultiEnum(query.priority);
      if (priorities && priorities.length > 0) {
        where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
      }
    }

    // Search filter
    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { location: { contains: q } },
          { id: { contains: q } },
        ],
      });
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
      complaints: complaints.map(formatComplaintForWorker),
      pagination,
    };
  }

  /**
   * Retrieve details of a task assigned to the worker
   */
  async getComplaintById(workerUser, id) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Task with ID ${id} not found`, 404);
    }

    // Strict role authorization: Workers can only view tasks assigned to them
    if (complaint.assignedWorkerId !== workerUser.id && workerUser.role !== 'ADMIN') {
      throw new AppError('Access denied: This task is not assigned to you.', 403);
    }

    return formatComplaintForWorker(complaint);
  }

  /**
   * Update task status (Accept, Start Work, or Mark Complete)
   */
  async updateStatus(workerUser, id, { status, notes, materialsUsed, resolutionNotes }) {
    const finalNotes = notes || resolutionNotes;
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Task with ID ${id} not found`, 404);
    }

    if (complaint.assignedWorkerId !== workerUser.id && workerUser.role !== 'ADMIN') {
      throw new AppError('Access denied: You can only update tasks assigned to you.', 403);
    }

    const normStatus = status.trim().toUpperCase();
    const activeAssignment = await assignmentRepository.findActiveByComplaint(id);

    // Validate state machine transition (ACCEPT maps to current ASSIGNED state with ACCEPTED taskStatus)
    const targetState = normStatus === 'ACCEPT' || normStatus === 'ACCEPTED' ? 'ASSIGNED' : normStatus;
    stateMachineService.validateTransition(complaint, targetState, workerUser);

    const now = new Date();
    const complaintUpdates = {};
    let historyAction = 'STATUS_CHANGE';
    let historyNotes = finalNotes;
    let assignmentStatus = null;
    let assignmentUpdates = {};

    if (normStatus === 'ACCEPT' || normStatus === 'ACCEPTED') {
      if (complaint.status !== 'ASSIGNED') {
        throw new AppError('Only tasks in ASSIGNED status can be accepted.', 400);
      }

      complaintUpdates.taskStatus = 'ACCEPTED';
      complaintUpdates.acceptedAt = now;

      assignmentStatus = 'ACCEPTED';
      assignmentUpdates = { status: 'ACCEPTED', acceptedAt: now };

      historyAction = 'TASK_ACCEPTED';
      historyNotes = finalNotes || `${workerUser.name} accepted task assignment`;

      // Log WorkUpdate
      await workUpdateRepository.create({
        complaintId: id,
        assignmentId: activeAssignment?.id || null,
        workerId: workerUser.id,
        updateType: 'STATUS_CHANGE',
        notes: historyNotes,
      });
    } else if (normStatus === 'IN_PROGRESS') {
      complaintUpdates.status = 'IN_PROGRESS';
      complaintUpdates.taskStatus = 'IN_PROGRESS';
      complaintUpdates.startedAt = now;

      assignmentStatus = 'IN_PROGRESS';
      assignmentUpdates = { status: 'IN_PROGRESS', startedAt: now };

      historyNotes = finalNotes || `${workerUser.name} commenced field repair operations`;

      await workUpdateRepository.create({
        complaintId: id,
        assignmentId: activeAssignment?.id || null,
        workerId: workerUser.id,
        updateType: 'STATUS_CHANGE',
        notes: historyNotes,
        materialsUsed: materialsUsed ? materialsUsed.trim() : null,
      });
    } else if (normStatus === 'RESOLUTION_SUBMITTED') {
      if (!finalNotes || finalNotes.trim() === '') {
        throw new AppError('Resolution notes are required when submitting completion.', 400);
      }

      complaintUpdates.status = 'RESOLUTION_SUBMITTED';
      complaintUpdates.taskStatus = 'COMPLETED';
      complaintUpdates.resolutionNotes = finalNotes.trim();

      if (materialsUsed) {
        complaintUpdates.materialsUsed = materialsUsed.trim();
      }

      assignmentStatus = 'COMPLETED';
      assignmentUpdates = { status: 'COMPLETED', completedAt: now };

      historyNotes = finalNotes.trim();

      await workUpdateRepository.create({
        complaintId: id,
        assignmentId: activeAssignment?.id || null,
        workerId: workerUser.id,
        updateType: 'COMPLETION',
        notes: historyNotes,
        materialsUsed: materialsUsed ? materialsUsed.trim() : null,
      });
    } else if (normStatus === 'RESOLVED') {
      if (!finalNotes || finalNotes.trim() === '') {
        throw new AppError('Resolution notes are required when completing a task.', 400);
      }

      complaintUpdates.status = 'RESOLVED';
      complaintUpdates.taskStatus = 'COMPLETED';
      complaintUpdates.resolvedAt = now;
      complaintUpdates.resolutionNotes = finalNotes.trim();

      if (materialsUsed) {
        complaintUpdates.materialsUsed = materialsUsed.trim();
      }

      assignmentStatus = 'COMPLETED';
      assignmentUpdates = { status: 'COMPLETED', completedAt: now };

      historyNotes = finalNotes.trim();

      await workUpdateRepository.create({
        complaintId: id,
        assignmentId: activeAssignment?.id || null,
        workerId: workerUser.id,
        updateType: 'COMPLETION',
        notes: historyNotes,
        materialsUsed: materialsUsed ? materialsUsed.trim() : null,
      });
    } else {
      throw new AppError(`Unsupported status transition: ${status}`, 400);
    }

    // Persist updates to complaint
    await complaintRepository.update(id, complaintUpdates);

    // Persist updates to active assignment
    if (activeAssignment) {
      await assignmentRepository.update(activeAssignment.id, assignmentUpdates);
    }

    // Append to immutable ComplaintHistory
    await historyRepository.create({
      complaintId: id,
      fromStatus: complaint.status,
      toStatus: complaintUpdates.status || complaint.status,
      action: historyAction,
      notes: historyNotes,
      actorId: workerUser.id,
    });

    const refreshed = await complaintRepository.findById(id);

    // Dispatch event notifications
    if (complaintUpdates.status === 'RESOLUTION_SUBMITTED') {
      await notificationService.notifyResolutionSubmitted(refreshed, workerUser);
    } else if (complaintUpdates.status === 'RESOLVED') {
      await notificationService.notifyComplaintResolved(refreshed, workerUser);
      await notificationService.notifyWorkerCompletedAssignment(refreshed, workerUser);
    } else if (complaintUpdates.status === 'IN_PROGRESS') {
      await notificationService.notifyWorkStarted(refreshed, workerUser);
    }

    return formatComplaintForWorker(refreshed);
  }


  /**
   * Add a work progress update or notes checkpoint
   */
  async addWorkUpdate(workerUser, id, { notes, materialsUsed, updateType = 'PROGRESS' }) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Task with ID ${id} not found`, 404);
    }

    if (complaint.assignedWorkerId !== workerUser.id && workerUser.role !== 'ADMIN') {
      throw new AppError('Access denied: You can only add updates to tasks assigned to you.', 403);
    }

    const activeAssignment = await assignmentRepository.findActiveByComplaint(id);

    const update = await workUpdateRepository.create({
      complaintId: id,
      assignmentId: activeAssignment?.id || null,
      workerId: workerUser.id,
      updateType: updateType.toUpperCase(),
      notes: notes.trim(),
      materialsUsed: materialsUsed ? materialsUsed.trim() : null,
    });

    if (materialsUsed) {
      await complaintRepository.update(id, {
        materialsUsed: materialsUsed.trim(),
      });
    }

    // Append to history
    await historyRepository.create({
      complaintId: id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      action: 'WORK_UPDATE',
      notes: notes.trim(),
      actorId: workerUser.id,
    });

    const refreshed = await complaintRepository.findById(id);
    return {
      update,
      complaint: formatComplaintForWorker(refreshed),
    };
  }

  /**
   * Upload photographic evidence of completed repair or progress
   */
  async uploadEvidence(workerUser, id, file, { notes, imageUrl }) {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new AppError(`Task with ID ${id} not found`, 404);
    }

    if (complaint.assignedWorkerId !== workerUser.id && workerUser.role !== 'ADMIN') {
      throw new AppError('Access denied: You can only upload evidence for tasks assigned to you.', 403);
    }

    let photoUrl = imageUrl;
    let publicId = null;
    let evidenceMeta = null;

    if (file) {
      const uploadResult = await storageService.upload(file);
      photoUrl = uploadResult.url;
      publicId = uploadResult.publicId;
      evidenceMeta = {
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        uploadedAt: uploadResult.uploadedAt,
      };
    }

    const existingPhotos = Array.isArray(complaint.resolutionPhotos)
      ? complaint.resolutionPhotos
      : [];

    const newPhoto = {
      id: publicId || `proof-${Date.now()}`,
      url: photoUrl,
      previewUrl: photoUrl,
      name: evidenceMeta?.originalName || 'repair_proof.jpg',
      size: evidenceMeta?.size ? `${(evidenceMeta.size / 1024).toFixed(0)} KB` : 'N/A',
      uploadedAt: new Date().toISOString(),
    };

    const updatedPhotos = [...existingPhotos, newPhoto];

    await complaintRepository.update(id, {
      resolutionPhotos: updatedPhotos,
    });

    const activeAssignment = await assignmentRepository.findActiveByComplaint(id);

    await workUpdateRepository.create({
      complaintId: id,
      assignmentId: activeAssignment?.id || null,
      workerId: workerUser.id,
      updateType: 'EVIDENCE',
      imageUrl: photoUrl,
      imagePublicId: publicId,
      evidenceMeta,
      notes: notes ? notes.trim() : 'Resolution photo evidence uploaded by technician',
    });

    await historyRepository.create({
      complaintId: id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      action: 'EVIDENCE_UPLOAD',
      notes: notes ? notes.trim() : 'Field technician uploaded resolution evidence',
      actorId: workerUser.id,
    });

    const refreshed = await complaintRepository.findById(id);
    return {
      photo: newPhoto,
      complaint: formatComplaintForWorker(refreshed),
    };
  }
}

module.exports = new WorkerService();

