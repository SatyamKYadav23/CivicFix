const prisma = require('../../src/config/db');

/**
 * Safely clean up test users and any associated cascade entities
 * @param {Array<string>} userIds
 */
async function cleanupUsers(userIds = []) {
  if (!userIds || userIds.length === 0) return;

  const validIds = userIds.filter(Boolean);
  if (validIds.length === 0) return;

  try {
    // 1. Find all complaints created by these users or assigned to these workers
    const complaints = await prisma.complaint.findMany({
      where: {
        OR: [
          { citizenId: { in: validIds } },
          { assignedWorkerId: { in: validIds } },
          { assignedAuthorityId: { in: validIds } },
        ],
      },
      select: { id: true },
    });

    const complaintIds = complaints.map((c) => c.id);

    if (complaintIds.length > 0) {
      await prisma.workUpdate.deleteMany({ where: { complaintId: { in: complaintIds } } });
      await prisma.assignment.deleteMany({ where: { complaintId: { in: complaintIds } } });
      await prisma.complaintHistory.deleteMany({ where: { complaintId: { in: complaintIds } } });
      await prisma.notification.deleteMany({ where: { complaintId: { in: complaintIds } } });
      await prisma.complaint.deleteMany({ where: { id: { in: complaintIds } } });
    }

    // 2. Delete notifications belonging to these users
    await prisma.notification.deleteMany({ where: { userId: { in: validIds } } });

    // 3. Delete users
    await prisma.user.deleteMany({ where: { id: { in: validIds } } });
  } catch (err) {
    // Teardown should not fail test runner if records already deleted
    console.warn('[cleanupUsers Warning]', err.message);
  }
}

/**
 * Clean up specific complaints by ID
 * @param {Array<string>} complaintIds
 */
async function cleanupComplaints(complaintIds = []) {
  if (!complaintIds || complaintIds.length === 0) return;

  const validIds = complaintIds.filter(Boolean);
  if (validIds.length === 0) return;

  try {
    await prisma.workUpdate.deleteMany({ where: { complaintId: { in: validIds } } });
    await prisma.assignment.deleteMany({ where: { complaintId: { in: validIds } } });
    await prisma.complaintHistory.deleteMany({ where: { complaintId: { in: validIds } } });
    await prisma.notification.deleteMany({ where: { complaintId: { in: validIds } } });
    await prisma.complaint.deleteMany({ where: { id: { in: validIds } } });
  } catch (err) {
    console.warn('[cleanupComplaints Warning]', err.message);
  }
}

module.exports = {
  cleanupUsers,
  cleanupComplaints,
};

