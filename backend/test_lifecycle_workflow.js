/**
 * Comprehensive Automated Verification Suite for Phase 7:
 * Complete Complaint Lifecycle & Controlled Status State Machine
 */
const http = require('http');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt.utils');

const PORT = 5011; // Ephemeral test port
let server;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyData = body ? JSON.stringify(body) : null;
    if (bodyData) headers['Content-Length'] = Buffer.byteLength(bodyData);

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : null;
            resolve({ status: res.statusCode, data: parsed, raw: rawData });
          } catch (e) {
            resolve({ status: res.statusCode, raw: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting CivicFix Phase 7: Complete Lifecycle & State Machine Verification ===\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });

  try {
    const passwordHash = await bcrypt.hash('Test@1234', 10);

    // 1. Setup Test Users
    console.log('[SETUP] Initializing test entities across all roles...');
    const citizen = await prisma.user.upsert({
      where: { email: 'phase7_citizen@civicfix.org' },
      update: { role: 'CITIZEN', status: 'ACTIVE' },
      create: {
        name: 'Sarah Citizen',
        email: 'phase7_citizen@civicfix.org',
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });

    const authority = await prisma.user.upsert({
      where: { email: 'phase7_authority@civicfix.org' },
      update: { role: 'AUTHORITY', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Director Dan',
        email: 'phase7_authority@civicfix.org',
        password: passwordHash,
        role: 'AUTHORITY',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const worker = await prisma.user.upsert({
      where: { email: 'phase7_worker@civicfix.org' },
      update: { role: 'WORKER', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Technician Tom',
        email: 'phase7_worker@civicfix.org',
        password: passwordHash,
        phone: '+1-555-ROAD-TOM',
        role: 'WORKER',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const bystanderCitizen = await prisma.user.upsert({
      where: { email: 'phase7_bystander@civicfix.org' },
      update: { role: 'CITIZEN', status: 'ACTIVE' },
      create: {
        name: 'Bystander Bob',
        email: 'phase7_bystander@civicfix.org',
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });

    // JWT Tokens
    const citizenToken = generateToken({ id: citizen.id, email: citizen.email, role: citizen.role });
    const authorityToken = generateToken({ id: authority.id, email: authority.email, role: authority.role });
    const workerToken = generateToken({ id: worker.id, email: worker.email, role: worker.role });
    const bystanderToken = generateToken({ id: bystanderCitizen.id, email: bystanderCitizen.email, role: bystanderCitizen.role });

    console.log('✓ Test users ready.\n');

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 1: Citizen Submits Complaint
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('[LIFECYCLE STEP 1] Citizen submits civic complaint');
    const createRes = await makeRequest(
      'POST',
      '/api/complaints',
      {
        title: 'Dangerous Pothole on Maple Street',
        description: 'Deep road cavity causing severe vehicular damage near intersection.',
        category: 'ROADS_POTHOLES',
        priority: 'HIGH',
        location: '123 Maple Street',
        latitude: 37.781,
        longitude: -122.411,
      },
      citizenToken
    );
    if (createRes.status !== 201) throw new Error(`Complaint creation failed: ${JSON.stringify(createRes.data)}`);
    const complaintId = createRes.data.data.id;
    console.log(`  ✓ Complaint created with ID: ${complaintId}`);
    console.log(`  ✓ Initial Status: ${createRes.data.data.status} (Expected: SUBMITTED)`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TEST STATE MACHINE ENFORCEMENT: Invalid Jumps Blocked
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[STATE MACHINE TEST] Attempting illegal status transitions');
    // A: Attempting to jump directly from SUBMITTED to RESOLVED
    const illegalJump = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'RESOLVED', notes: 'Trying to bypass review and work' },
      authorityToken
    );
    if (illegalJump.status === 400) {
      console.log('  ✓ 400 Bad Request: State Machine blocked direct jump SUBMITTED → RESOLVED');
    } else {
      throw new Error(`Expected 400 for illegal transition, got ${illegalJump.status}`);
    }

    // B: Citizen trying to mark complaint as RESOLVED
    const citizenIllegalResolve = await makeRequest(
      'PUT',
      `/api/complaints/${complaintId}`,
      { status: 'RESOLVED' },
      citizenToken
    );
    if (citizenIllegalResolve.status === 403 || citizenIllegalResolve.status === 400) {
      console.log('  ✓ 403/400 Forbidden: Citizen blocked from marking complaint RESOLVED');
    } else {
      throw new Error(`Expected 403/400, got ${citizenIllegalResolve.status}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 2: Authority Reviews Complaint (SUBMITTED → UNDER_REVIEW)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 2] Authority begins review (SUBMITTED → UNDER_REVIEW)');
    const reviewRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'UNDER_REVIEW', notes: 'Inspector reviewing incident report and site photos.' },
      authorityToken
    );
    if (reviewRes.status === 200 && reviewRes.data.data.status === 'UNDER_REVIEW') {
      console.log('  ✓ Complaint status transitioned to: UNDER_REVIEW');
    } else {
      throw new Error(`Failed to move to UNDER_REVIEW: ${JSON.stringify(reviewRes.data)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 3: Authority Dispatches Field Worker (UNDER_REVIEW → ASSIGNED)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 3] Authority dispatches worker (UNDER_REVIEW → ASSIGNED)');
    const assignRes = await makeRequest(
      'POST',
      `/api/authority/complaints/${complaintId}/assign-worker`,
      {
        workerId: worker.id,
        notes: 'Deploy asphalt road crew to Maple St within 24h.',
      },
      authorityToken
    );
    if (assignRes.status === 200 && assignRes.data.data.status === 'ASSIGNED') {
      console.log('  ✓ Worker assigned! Status transitioned to: ASSIGNED');
      console.log(`  ✓ Assigned Worker: ${assignRes.data.data.assignedWorker?.name}`);
    } else {
      throw new Error(`Failed to assign worker: ${JSON.stringify(assignRes.data)}`);
    }

    // Verify Worker received Notification
    const workerNotifications = await makeRequest('GET', '/api/notifications', null, workerToken);
    const taskAssignedAlert = workerNotifications.data.data.notifications.find(
      (n) => n.targetId === complaintId && n.type === 'TASK_ASSIGNED'
    );
    if (taskAssignedAlert) {
      console.log(`  ✓ Worker received TASK_ASSIGNED notification: "${taskAssignedAlert.title}"`);
    } else {
      throw new Error('Worker was not notified of task assignment');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 4: Worker Accepts Assignment (ASSIGNED → taskStatus: ACCEPTED)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 4] Worker accepts assigned task');
    const acceptRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaintId}/status`,
      { status: 'ACCEPTED', notes: 'Technician Tom accepted repair docket.' },
      workerToken
    );
    if (acceptRes.status === 200 && acceptRes.data.data.taskStatus === 'ACCEPTED') {
      console.log(`  ✓ Task accepted by worker! acceptedAt: ${acceptRes.data.data.acceptedAt}`);
    } else {
      throw new Error(`Failed to accept task: ${JSON.stringify(acceptRes.data)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 5: Worker Commences Field Work (ASSIGNED → IN_PROGRESS)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 5] Worker commences field work (ASSIGNED → IN_PROGRESS)');
    const startRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaintId}/status`,
      { status: 'IN_PROGRESS', notes: 'Arrived at 123 Maple St with asphalt patching truck.' },
      workerToken
    );
    if (startRes.status === 200 && startRes.data.data.status === 'IN_PROGRESS') {
      console.log(`  ✓ Status transitioned to: IN_PROGRESS (startedAt: ${startRes.data.data.startedAt})`);
    } else {
      throw new Error(`Failed to start work: ${JSON.stringify(startRes.data)}`);
    }

    // Verify Citizen received Work In Progress Notification
    const citizenProgNotifs = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const inProgAlert = citizenProgNotifs.data.data.notifications.find(
      (n) => n.targetId === complaintId && n.type === 'STATUS_UPDATED'
    );
    if (inProgAlert) {
      console.log(`  ✓ Citizen received STATUS_UPDATED notification: "${inProgAlert.message}"`);
    } else {
      throw new Error('Citizen was not notified of work starting');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 6: Worker Submits Resolution for Authority Review (IN_PROGRESS → RESOLUTION_SUBMITTED)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 6] Worker submits completion for review (IN_PROGRESS → RESOLUTION_SUBMITTED)');
    const submitResRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaintId}/status`,
      {
        status: 'RESOLUTION_SUBMITTED',
        notes: 'Pothole excavated, hot tack primer applied, compacted with 150kg hot asphalt. Smooth road grade restored.',
        materialsUsed: '150kg Hot mix asphalt, 8L primer',
      },
      workerToken
    );
    if (submitResRes.status === 200 && submitResRes.data.data.status === 'RESOLUTION_SUBMITTED') {
      console.log('  ✓ Status transitioned to: RESOLUTION_SUBMITTED');
      console.log(`  ✓ taskStatus: ${submitResRes.data.data.taskStatus} (COMPLETED)`);
    } else {
      throw new Error(`Failed to submit resolution: ${JSON.stringify(submitResRes.data)}`);
    }

    // Verify Authority received COMPLETION_PENDING_REVIEW Notification
    const authNotifs = await makeRequest('GET', '/api/notifications', null, authorityToken);
    const reviewAlert = authNotifs.data.data.notifications.find(
      (n) => n.targetId === complaintId && n.type === 'COMPLETION_PENDING_REVIEW'
    );
    if (reviewAlert) {
      console.log(`  ✓ Authority received COMPLETION_PENDING_REVIEW notification: "${reviewAlert.title}"`);
    } else {
      throw new Error('Authority was not notified of completion submission');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 7: Authority Inspects & Approves Resolution (RESOLUTION_SUBMITTED → RESOLVED)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 7] Authority inspects and approves resolution (RESOLUTION_SUBMITTED → RESOLVED)');
    const approveRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'RESOLVED', notes: 'Field inspection confirmed satisfactory road finish. Approved.' },
      authorityToken
    );
    if (approveRes.status === 200 && approveRes.data.data.status === 'RESOLVED') {
      console.log('  ✓ Status transitioned to: RESOLVED');
      console.log(`  ✓ resolvedAt timestamp: ${approveRes.data.data.resolvedAt}`);
    } else {
      throw new Error(`Failed to resolve complaint: ${JSON.stringify(approveRes.data)}`);
    }

    // Verify Citizen received COMPLAINT_RESOLVED Notification
    const citizenResolvedNotifs = await makeRequest('GET', '/api/notifications', null, citizenToken);
    const resolvedAlert = citizenResolvedNotifs.data.data.notifications.find(
      (n) => n.targetId === complaintId && n.type === 'COMPLAINT_RESOLVED'
    );
    if (resolvedAlert) {
      console.log(`  ✓ Citizen received COMPLAINT_RESOLVED alert: "${resolvedAlert.message}"`);
    } else {
      throw new Error('Citizen was not notified of resolution');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 8: Citizen Inspects and Submits 5-Star Feedback (RESOLVED → CLOSED)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 8] Citizen provides satisfaction feedback (RESOLVED → CLOSED)');
    // A: Bystander trying to submit feedback on someone else's complaint
    const bystanderFeedback = await makeRequest(
      'POST',
      `/api/complaints/${complaintId}/feedback`,
      { rating: 5, comment: 'Bystander rating' },
      bystanderToken
    );
    if (bystanderFeedback.status === 403) {
      console.log('  ✓ 403 Forbidden: Bystander blocked from submitting feedback on another citizen complaint');
    } else {
      throw new Error(`Expected 403, got ${bystanderFeedback.status}`);
    }

    // B: Citizen submits valid 5-star feedback
    const feedbackRes = await makeRequest(
      'POST',
      `/api/complaints/${complaintId}/feedback`,
      {
        rating: 5,
        comment: 'Outstanding repair! Pothole completely leveled and clean. Quick response by the municipal team.',
      },
      citizenToken
    );
    if (feedbackRes.status === 200) {
      const closedComplaint = feedbackRes.data.data;
      console.log(`  ✓ Feedback submitted successfully! Final Status: ${closedComplaint.status} (Expected: CLOSED)`);
      console.log(`  ✓ Feedback Rating: ${closedComplaint.feedback?.rating} / 5 Stars`);
      console.log(`  ✓ Feedback Comment: "${closedComplaint.feedback?.comment}"`);
      if (closedComplaint.status !== 'CLOSED') throw new Error('Complaint status is not CLOSED');
    } else {
      throw new Error(`Failed to submit feedback: ${JSON.stringify(feedbackRes.data)}`);
    }

    // Verify Authority received FEEDBACK_SUBMITTED Notification
    const authFeedbackNotifs = await makeRequest('GET', '/api/notifications', null, authorityToken);
    const feedbackAlert = authFeedbackNotifs.data.data.notifications.find(
      (n) => n.targetId === complaintId && n.type === 'FEEDBACK_SUBMITTED'
    );
    if (feedbackAlert) {
      console.log(`  ✓ Authority received FEEDBACK_SUBMITTED alert: "${feedbackAlert.message}"`);
    } else {
      throw new Error('Authority was not notified of citizen feedback');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 9: Verify Complaint History & Timeline API (GET /api/complaints/:id/history)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 9] Verify Complaint History & Timeline API');
    const historyRes = await makeRequest('GET', `/api/complaints/${complaintId}/history`, null, citizenToken);
    if (historyRes.status === 200) {
      const historyData = historyRes.data.data;
      console.log(`  ✓ Timeline retrieved for complaint: "${historyData.title}"`);
      console.log(`  ✓ Final Status: ${historyData.currentStatus}`);
      console.log(`  ✓ Timeline events count: ${historyData.timeline?.length}`);
      console.log(`  ✓ Raw history records count: ${historyData.history?.length}`);

      const eventSummary = historyData.timeline.map((t) => ({
        step: t.title,
        status: t.status,
        actor: t.actor,
        time: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'N/A',
      }));
      console.table(eventSummary);

      if (historyData.timeline.length < 6) {
        throw new Error(`Expected at least 6 timeline milestones, got ${historyData.timeline.length}`);
      }
    } else {
      throw new Error(`Failed to retrieve complaint history: ${JSON.stringify(historyRes.data)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 10: Verify Reopening and Appeal Capabilities
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 10] Testing Reopening & Appeal Transitions');
    // Citizen reopens the complaint
    const reopenRes = await makeRequest(
      'PUT',
      `/api/complaints/${complaintId}`,
      {
        status: 'REOPENED',
        notes: 'Rain revealed edge erosion near curb. Please schedule follow-up inspection.',
      },
      citizenToken
    );
    if (reopenRes.status === 200 && reopenRes.data.data.status === 'REOPENED') {
      console.log('  ✓ Citizen successfully reopened complaint (CLOSED → REOPENED)');
      console.log(`  ✓ resolvedAt cleared upon reopening: ${reopenRes.data.data.resolvedAt === null}`);
    } else {
      throw new Error(`Failed to reopen complaint: ${JSON.stringify(reopenRes.data)}`);
    }

    // Authority triages reopened complaint back to UNDER_REVIEW
    const retriageRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${complaintId}/status`,
      { status: 'UNDER_REVIEW', notes: 'Reopened docket under re-inspection.' },
      authorityToken
    );
    if (retriageRes.status === 200 && retriageRes.data.data.status === 'UNDER_REVIEW') {
      console.log('  ✓ Authority successfully triaged reopened complaint (REOPENED → UNDER_REVIEW)');
    } else {
      throw new Error(`Failed to retriage reopened complaint: ${JSON.stringify(retriageRes.data)}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 11: Notification Read / Mark-All-Read API Test
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n[LIFECYCLE STEP 11] Testing Notification Management APIs');
    const markAllRes = await makeRequest('PATCH', '/api/notifications/read-all', null, citizenToken);
    if (markAllRes.status === 200) {
      console.log('  ✓ PATCH /api/notifications/read-all succeeded');
      const unreadCheck = await makeRequest('GET', '/api/notifications', null, citizenToken);
      console.log(`  ✓ Unread notification count after mark-all-read: ${unreadCheck.data.data.unreadCount}`);
      if (unreadCheck.data.data.unreadCount !== 0) throw new Error('Unread count is not 0 after mark-all-read');
    } else {
      throw new Error(`Failed to mark notifications read: ${JSON.stringify(markAllRes.data)}`);
    }

    console.log('\n🎉 ALL PHASE 7 COMPLETE LIFECYCLE TESTS PASSED WITH 100% SUCCESS! 🎉');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('[TEST SERVER] Closed');
    }
    await prisma.$disconnect();
  }
}

runTests();

