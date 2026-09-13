const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('./src/app');
const prisma = require('./src/config/db');

const TEST_PORT = 5012;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const headers = {};

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  const server = app.listen(TEST_PORT);
  await new Promise((resolve) => server.once('listening', resolve));
  console.log(`[TEST SERVER] Running on port ${TEST_PORT}\n`);

  try {
    const timestamp = Date.now();
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // ─────────────────────────────────────────────────────────────────────────────
    // SETUP: Create Actors
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('[SETUP] Creating and logging in test actors...');

    // 1. Citizen A
    const citizenEmail = `citizen_notif_${timestamp}@test.com`;
    const citizenReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Alice Citizen',
      email: citizenEmail,
      password: defaultPassword,
      phone: '+15550001',
      address: '100 Oak St',
    });
    const citizenToken = citizenReg.data.data.token;
    const citizenId = citizenReg.data.data.user.id;
    console.log(`  ✓ Citizen created: ${citizenEmail} (ID: ${citizenId})`);

    // 2. Citizen B (for security testing)
    const citizenBEmail = `citizen_b_${timestamp}@test.com`;
    const citizenBReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Bob Citizen',
      email: citizenBEmail,
      password: defaultPassword,
      phone: '+15550002',
      address: '200 Pine St',
    });
    const citizenBToken = citizenBReg.data.data.token;
    console.log(`  ✓ Citizen B created for security tests`);

    // 3. Roads Authority Officer
    const authEmail = `auth_notif_${timestamp}@test.com`;
    await prisma.user.create({
      data: {
        name: 'Officer Davis',
        email: authEmail,
        password: passwordHash,
        phone: '+15550003',
        role: 'AUTHORITY',
        department: 'Roads & Potholes',
        designation: 'Chief Road Inspector',
        zone: 'North District',
      },
    });
    const authLogin = await makeRequest('POST', '/api/auth/login', {
      email: authEmail,
      password: defaultPassword,
    });
    const authId = authLogin.data.data.user.id;
    const authToken = authLogin.data.data.token;
    console.log(`  ✓ Roads Authority created: ${authEmail} (ID: ${authId})`);

    // 4. Worker
    const workerEmail = `worker_notif_${timestamp}@test.com`;
    const workerUser = await prisma.user.create({
      data: {
        name: 'Walter Worker',
        email: workerEmail,
        password: passwordHash,
        phone: '+15550004',
        role: 'WORKER',
        department: 'Roads & Potholes',
        designation: 'Paving Specialist',
        status: 'AVAILABLE',
      },
    });
    await prisma.workerProfile.create({
      data: {
        userId: workerUser.id,
        department: 'Roads & Potholes',
        skills: 'asphalt,patching,heavy_equipment',
        isAvailable: true,
      },
    });
    const workerLogin = await makeRequest('POST', '/api/auth/login', {
      email: workerEmail,
      password: defaultPassword,
    });
    const workerToken = workerLogin.data.data.token;
    const workerId = workerLogin.data.data.user.id;
    console.log(`  ✓ Worker created: ${workerEmail} (ID: ${workerId})`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: Citizen Submits Complaint → Citizen Confirmation & Authority Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 1] Complaint Created Event Notification');
    const complaintRes = await makeRequest(
      'POST',
      '/api/complaints',
      {
        title: 'Deep sinkhole on 5th Avenue',
        description: 'Large crater in right lane causing severe tire damage.',
        category: 'ROADS_POTHOLES',
        priority: 'HIGH',
        location: '5th Ave & Pine St',
        latitude: 40.7128,
        longitude: -74.006,
      },
      citizenToken
    );
    if (complaintRes.status !== 201) {
      throw new Error(`Failed to create complaint: ${JSON.stringify(complaintRes.data)}`);
    }
    const complaintId = complaintRes.data.data.id;
    console.log(`  ✓ Complaint submitted: ID ${complaintId}`);

    // Check Citizen notification
    const citizenNotifs1 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenCreatedNotif = citizenNotifs1.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_CREATED' && n.complaintId === complaintId
    );
    if (!citizenCreatedNotif) {
      throw new Error('Citizen did not receive COMPLAINT_CREATED confirmation notification');
    }
    console.log(`  ✓ Citizen received confirmation: "${citizenCreatedNotif.title}" — "${citizenCreatedNotif.message}"`);
    console.log(`    - Has recipient: ${Boolean(citizenCreatedNotif.recipient)}`);
    console.log(`    - Has relatedComplaint: ${Boolean(citizenCreatedNotif.relatedComplaint)}`);
    console.log(`    - Read status: ${citizenCreatedNotif.read} (isRead: ${citizenCreatedNotif.isRead})`);

    // Check Authority notification
    const authNotifs1 = await makeRequest('GET', '/api/notifications', null, authToken);
    const authCreatedNotif = authNotifs1.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_CREATED' && n.complaintId === complaintId
    );
    if (!authCreatedNotif) {
      throw new Error('Authority did not receive COMPLAINT_CREATED alert for their jurisdiction');
    }
    console.log(`  ✓ Authority received alert: "${authCreatedNotif.title}" — "${authCreatedNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 2: Authority Reviews Complaint → Citizen Status Updated Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 2] Complaint Under Review Status Update Alert');
    const reviewRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'UNDER_REVIEW', notes: 'Inspection scheduled' },
      authToken
    );
    if (reviewRes.status !== 200) {
      throw new Error(`Failed to update status to UNDER_REVIEW: ${JSON.stringify(reviewRes.data)}`);
    }

    const citizenNotifs2 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenUnderReviewNotif = citizenNotifs2.data.data.notifications.find(
      (n) => n.type === 'STATUS_UPDATED' && n.title.includes('UNDER_REVIEW')
    );
    if (!citizenUnderReviewNotif) {
      throw new Error('Citizen did not receive STATUS_UPDATED notification for UNDER_REVIEW');
    }
    console.log(`  ✓ Citizen notified of review status: "${citizenUnderReviewNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 3: Authority Assigns Worker → Worker Alert & Citizen Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 3] Worker Assignment Event Notifications');
    const assignRes = await makeRequest(
      'POST',
      `/api/authority/complaints/${complaintId}/assign-worker`,
      { workerId, notes: 'Deploy asphalt roller crew' },
      authToken
    );
    if (assignRes.status !== 200) {
      throw new Error(`Failed to assign worker: ${JSON.stringify(assignRes.data)}`);
    }

    // Check Worker received TASK_ASSIGNED
    const workerNotifs1 = await makeRequest('GET', '/api/notifications', null, workerToken);
    const workerTaskNotif = workerNotifs1.data.data.notifications.find(
      (n) => n.type === 'TASK_ASSIGNED' && n.complaintId === complaintId
    );
    if (!workerTaskNotif) {
      throw new Error('Worker did not receive TASK_ASSIGNED notification');
    }
    console.log(`  ✓ Worker received assignment: "${workerTaskNotif.title}" — "${workerTaskNotif.message}"`);

    // Check Citizen received WORKER_ASSIGNED
    const citizenNotifs3 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenWorkerNotif = citizenNotifs3.data.data.notifications.find(
      (n) => n.type === 'WORKER_ASSIGNED' && n.complaintId === complaintId
    );
    if (!citizenWorkerNotif) {
      throw new Error('Citizen did not receive WORKER_ASSIGNED notification');
    }
    console.log(`  ✓ Citizen notified of assigned technician: "${citizenWorkerNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 4: Worker Commences Work → Citizen In-Progress Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 4] Field Work Commenced Alert');
    const startRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaintId}/status`,
      { status: 'IN_PROGRESS', notes: 'Arrived on site with roller truck' },
      workerToken
    );
    if (startRes.status !== 200) {
      throw new Error(`Failed to move to IN_PROGRESS: ${JSON.stringify(startRes.data)}`);
    }

    const citizenNotifs4 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenInProgressNotif = citizenNotifs4.data.data.notifications.find(
      (n) => n.type === 'STATUS_UPDATED' && n.title.includes('Work In Progress')
    );
    if (!citizenInProgressNotif) {
      throw new Error('Citizen did not receive Work In Progress notification');
    }
    console.log(`  ✓ Citizen notified of work start: "${citizenInProgressNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 5: Worker Submits Resolution → Authority Review Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 5] Resolution Submitted Alert');
    const submitRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaintId}/status`,
      {
        status: 'RESOLUTION_SUBMITTED',
        resolutionNotes: 'Filled crater with hot mix and compacted level with street.',
      },
      workerToken
    );
    if (submitRes.status !== 200) {
      throw new Error(`Failed to submit resolution: ${JSON.stringify(submitRes.data)}`);
    }

    const authNotifs2 = await makeRequest('GET', '/api/notifications', null, authToken);
    const authResolutionNotif = authNotifs2.data.data.notifications.find(
      (n) => n.type === 'COMPLETION_PENDING_REVIEW' && n.complaintId === complaintId
    );
    if (!authResolutionNotif) {
      throw new Error('Authority did not receive COMPLETION_PENDING_REVIEW notification');
    }
    console.log(`  ✓ Authority notified of resolution submission: "${authResolutionNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 6: Authority Approves & Resolves → Citizen Resolved & Feedback Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 6] Complaint Resolved Alert');
    const resolveRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'RESOLVED', notes: 'Site inspection verified smooth road surface.' },
      authToken
    );
    if (resolveRes.status !== 200) {
      throw new Error(`Failed to resolve complaint: ${JSON.stringify(resolveRes.data)}`);
    }

    const citizenNotifs5 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenResolvedNotif = citizenNotifs5.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_RESOLVED' && n.complaintId === complaintId
    );
    if (!citizenResolvedNotif) {
      throw new Error('Citizen did not receive COMPLAINT_RESOLVED notification');
    }
    console.log(`  ✓ Citizen notified of resolution: "${citizenResolvedNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 7: Citizen Submits Feedback → Authority & Worker Feedback Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 7] Citizen Feedback Submitted Alert');
    const feedbackRes = await makeRequest(
      'POST',
      `/api/complaints/${complaintId}/feedback`,
      { rating: 5, comment: 'Pothole completely gone! Fantastic response time.' },
      citizenToken
    );
    if (feedbackRes.status !== 200) {
      throw new Error(`Failed to submit feedback: ${JSON.stringify(feedbackRes.data)}`);
    }

    // Check Authority received feedback alert
    const authNotifs3 = await makeRequest('GET', '/api/notifications', null, authToken);
    const authFeedbackNotif = authNotifs3.data.data.notifications.find(
      (n) => n.type === 'FEEDBACK_SUBMITTED' && n.complaintId === complaintId
    );
    if (!authFeedbackNotif) {
      throw new Error('Authority did not receive FEEDBACK_SUBMITTED notification');
    }
    console.log(`  ✓ Authority received feedback notification: "${authFeedbackNotif.message}"`);

    // Check Worker received feedback alert
    const workerNotifs2 = await makeRequest('GET', '/api/notifications', null, workerToken);
    const workerFeedbackNotif = workerNotifs2.data.data.notifications.find(
      (n) => n.type === 'FEEDBACK_SUBMITTED' && n.complaintId === complaintId
    );
    if (!workerFeedbackNotif) {
      throw new Error('Worker did not receive FEEDBACK_SUBMITTED notification');
    }
    console.log(`  ✓ Worker received feedback notification: "${workerFeedbackNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 8: Citizen Reopens Complaint → Citizen, Authority & Worker Reopened Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 8] Complaint Reopened Event Alert');
    const reopenRes = await makeRequest(
      'PUT',
      `/api/complaints/${complaintId}`,
      { status: 'REOPENED', notes: 'Asphalt settled under rain and depression returned.' },
      citizenToken
    );
    if (reopenRes.status !== 200) {
      throw new Error(`Failed to reopen complaint: ${JSON.stringify(reopenRes.data)}`);
    }

    const citizenNotifs6 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenReopenedNotif = citizenNotifs6.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_REOPENED' && n.complaintId === complaintId
    );
    if (!citizenReopenedNotif) {
      throw new Error('Citizen did not receive COMPLAINT_REOPENED confirmation');
    }
    console.log(`  ✓ Citizen received reopening confirmation: "${citizenReopenedNotif.message}"`);

    const authNotifs4 = await makeRequest('GET', '/api/notifications', null, authToken);
    const authReopenedNotif = authNotifs4.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_REOPENED' && n.complaintId === complaintId
    );
    if (!authReopenedNotif) {
      throw new Error('Authority did not receive COMPLAINT_REOPENED alert');
    }
    console.log(`  ✓ Authority received reopening alert: "${authReopenedNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 9: Complaint Rejection Alert
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 9] Complaint Rejected Event Alert');
    // Create another complaint to reject
    const complaint2Res = await makeRequest(
      'POST',
      '/api/complaints',
      {
        title: 'Private driveway puddle',
        description: 'Water standing in private property driveway.',
        category: 'ROADS_POTHOLES',
        location: 'Private Lane 1',
      },
      citizenToken
    );
    const complaint2Id = complaint2Res.data.data.id;

    // Authority rejects complaint
    const rejectRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaint2Id}/status`,
      { status: 'REJECTED', notes: 'Private property outside municipal jurisdiction.' },
      authToken
    );
    if (rejectRes.status !== 200) {
      throw new Error(`Failed to reject complaint: ${JSON.stringify(rejectRes.data)}`);
    }

    const citizenNotifs7 = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const citizenRejectNotif = citizenNotifs7.data.data.notifications.find(
      (n) => n.type === 'COMPLAINT_REJECTED' && n.complaintId === complaint2Id
    );
    if (!citizenRejectNotif) {
      throw new Error('Citizen did not receive COMPLAINT_REJECTED notification');
    }
    console.log(`  ✓ Citizen received rejection notification: "${citizenRejectNotif.message}"`);

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 10: Notification API Management & Cross-User Security Checks
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[SCENARIO 10] Notification Management APIs & Security');

    // A: GET /api/notifications with unread count
    const listRes = await makeRequest('GET', '/api/notifications', null, citizenToken);
    if (listRes.status !== 200) {
      throw new Error(`Failed to list notifications: ${JSON.stringify(listRes.data)}`);
    }
    const citizenNotifList = listRes.data.data.notifications;
    const initialUnreadCount = listRes.data.data.unreadCount;
    console.log(`  ✓ Retrieved ${citizenNotifList.length} notifications for citizen (Unread: ${initialUnreadCount})`);

    const targetNotif = citizenNotifList[0];
    if (!targetNotif) {
      throw new Error('Expected at least one notification');
    }

    // B: Security Check — User B attempting to mark Citizen A's notification as read
    const hackRes = await makeRequest('PATCH', `/api/notifications/${targetNotif.id}/read`, null, citizenBToken);
    if (hackRes.status === 403) {
      console.log('  ✓ 403 Forbidden: Cross-user notification tampering blocked');
    } else {
      throw new Error(`Expected 403 for cross-user mark-as-read, got ${hackRes.status}`);
    }

    // C: Mark single notification as read
    const readSingleRes = await makeRequest('PATCH', `/api/notifications/${targetNotif.id}/read`, null, citizenToken);
    if (readSingleRes.status !== 200) {
      throw new Error(`Failed to mark single notification as read: ${JSON.stringify(readSingleRes.data)}`);
    }
    console.log(`  ✓ Successfully marked single notification ${targetNotif.id} as read`);

    // Verify unread count decremented
    const listAfterSingle = await makeRequest('GET', '/api/notifications', null, citizenToken);
    if (listAfterSingle.data.data.unreadCount !== initialUnreadCount - 1) {
      throw new Error(`Expected unreadCount ${initialUnreadCount - 1}, got ${listAfterSingle.data.data.unreadCount}`);
    }
    console.log(`  ✓ Unread count decremented to ${listAfterSingle.data.data.unreadCount}`);

    // D: Mark all notifications as read
    const readAllRes = await makeRequest('PATCH', '/api/notifications/read-all', null, citizenToken);
    if (readAllRes.status !== 200) {
      throw new Error(`Failed to mark all as read: ${JSON.stringify(readAllRes.data)}`);
    }
    console.log('  ✓ Successfully marked all notifications as read');

    // Verify unread count is now 0
    const listAfterAll = await makeRequest('GET', '/api/notifications', null, citizenToken);
    if (listAfterAll.data.data.unreadCount !== 0) {
      throw new Error(`Expected unreadCount 0, got ${listAfterAll.data.data.unreadCount}`);
    }
    console.log('  ✓ Verified unread count is now 0');

    console.log('\n🎉 ALL 10 NOTIFICATION SYSTEM TEST SCENARIOS PASSED WITH 100% SUCCESS! 🎉');
  } finally {
    server.close();
    console.log('[TEST SERVER] Closed');
  }
}

runTests().catch((err) => {
  console.error('\n❌ NOTIFICATION TEST FAILED:', err);
  process.exit(1);
});
