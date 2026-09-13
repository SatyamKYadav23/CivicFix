/**
 * Comprehensive Automated Verification Script for Phase 5: Authority Workflow
 */
const http = require('http');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt.utils');

const PORT = 5009; // Ephemeral test port
let server;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const bodyData = body ? JSON.stringify(body) : null;
    if (bodyData) {
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

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
    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Starting CivicFix Phase 5: Authority Workflow Verification ===\n');

  // Start HTTP server on test port
  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });

  try {
    const passwordHash = await bcrypt.hash('Test@1234', 10);

    // 1. Setup Test Users
    console.log('[SETUP] Seeding/Updating test users...');
    const citizenUser = await prisma.user.upsert({
      where: { email: 'phase5_citizen@civicfix.org' },
      update: { role: 'CITIZEN', status: 'ACTIVE' },
      create: {
        name: 'Phase5 Citizen',
        email: 'phase5_citizen@civicfix.org',
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });

    const roadsAuthority = await prisma.user.upsert({
      where: { email: 'phase5_roads_auth@civicfix.org' },
      update: { role: 'AUTHORITY', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Roads Authority Officer',
        email: 'phase5_roads_auth@civicfix.org',
        password: passwordHash,
        role: 'AUTHORITY',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const waterAuthority = await prisma.user.upsert({
      where: { email: 'phase5_water_auth@civicfix.org' },
      update: { role: 'AUTHORITY', department: 'Water Supply & Leakage', status: 'ACTIVE' },
      create: {
        name: 'Water Authority Officer',
        email: 'phase5_water_auth@civicfix.org',
        password: passwordHash,
        role: 'AUTHORITY',
        department: 'Water Supply & Leakage',
        status: 'ACTIVE',
      },
    });

    const generalAuthority = await prisma.user.upsert({
      where: { email: 'phase5_general_auth@civicfix.org' },
      update: { role: 'AUTHORITY', department: 'Municipal Operations & Infrastructure', status: 'ACTIVE' },
      create: {
        name: 'General Authority Director',
        email: 'phase5_general_auth@civicfix.org',
        password: passwordHash,
        role: 'AUTHORITY',
        department: 'Municipal Operations & Infrastructure',
        status: 'ACTIVE',
      },
    });

    const workerUser = await prisma.user.upsert({
      where: { email: 'phase5_worker@civicfix.org' },
      update: { role: 'WORKER', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Paving Tech John',
        email: 'phase5_worker@civicfix.org',
        password: passwordHash,
        phone: '+1-555-ROAD',
        role: 'WORKER',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const adminUser = await prisma.user.upsert({
      where: { email: 'phase5_admin@civicfix.org' },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        name: 'System Admin',
        email: 'phase5_admin@civicfix.org',
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Generate JWT tokens for test roles
    const citizenToken = generateToken({ id: citizenUser.id, email: citizenUser.email, role: citizenUser.role });
    const roadsAuthToken = generateToken({ id: roadsAuthority.id, email: roadsAuthority.email, role: roadsAuthority.role });
    const waterAuthToken = generateToken({ id: waterAuthority.id, email: waterAuthority.email, role: waterAuthority.role });
    const generalAuthToken = generateToken({ id: generalAuthority.id, email: generalAuthority.email, role: generalAuthority.role });
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    console.log('✓ Test users and tokens initialized.\n');

    // 2. Test RBAC Protection on /api/authority endpoints
    console.log('[TEST 1] RBAC Authorization Enforcement');
    // A: Unauthenticated
    const resNoAuth = await makeRequest('GET', '/api/authority/complaints');
    if (resNoAuth.status === 401) {
      console.log('  ✓ 401 Unauthorized when no token provided');
    } else {
      throw new Error(`Expected 401, got ${resNoAuth.status}`);
    }

    // B: Citizen accessing authority endpoint
    const resCitizenForbidden = await makeRequest('GET', '/api/authority/complaints', null, citizenToken);
    if (resCitizenForbidden.status === 403) {
      console.log('  ✓ 403 Forbidden when CITIZEN accesses /api/authority/complaints');
    } else {
      throw new Error(`Expected 403, got ${resCitizenForbidden.status}`);
    }

    // C: Authority accessing authority endpoint
    const resAuthOk = await makeRequest('GET', '/api/authority/complaints', null, roadsAuthToken);
    if (resAuthOk.status === 200) {
      console.log('  ✓ 200 OK when AUTHORITY accesses /api/authority/complaints');
    } else {
      throw new Error(`Expected 200, got ${resAuthOk.status}`);
    }

    // 3. Create a Road Complaint via Citizen API
    console.log('\n[TEST 2] Citizen reports a ROADS_POTHOLES complaint');
    const createRes = await makeRequest(
      'POST',
      '/api/complaints',
      {
        title: 'Dangerous Pothole on 5th Avenue',
        description: 'Huge 2ft deep pothole near intersection causing vehicle damage.',
        category: 'ROADS_POTHOLES',
        priority: 'MEDIUM',
        location: '5th Avenue & Elm St',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      citizenToken
    );

    if (createRes.status !== 201) {
      throw new Error(`Failed to create complaint: ${JSON.stringify(createRes.data)}`);
    }
    const roadComplaint = createRes.data.data;
    console.log(`  ✓ Complaint created with ID: ${roadComplaint.id}`);
    console.log(`  ✓ Initial status: ${roadComplaint.status}`);
    console.log(`  ✓ Initial history count: ${roadComplaint.history?.length || 0}`);
    if (!roadComplaint.history || roadComplaint.history.length === 0) {
      throw new Error('Initial ComplaintHistory was not recorded on creation');
    }
    if (roadComplaint.history[0].action !== 'CREATED') {
      throw new Error(`Expected action 'CREATED', got ${roadComplaint.history[0].action}`);
    }

    // 4. Test Jurisdiction Scoping
    console.log('\n[TEST 3] Authority Jurisdiction Filtering');
    // Water authority should NOT see the road complaint in their queue
    const waterQueue = await makeRequest('GET', '/api/authority/complaints', null, waterAuthToken);
    const foundInWater = waterQueue.data.data.complaints.some((c) => c.id === roadComplaint.id);
    if (!foundInWater) {
      console.log('  ✓ Water Authority CANNOT see Roads & Potholes complaint in queue');
    } else {
      throw new Error('Water Authority was able to see complaint outside its jurisdiction!');
    }

    // Roads authority SHOULD see the road complaint
    const roadsQueue = await makeRequest('GET', '/api/authority/complaints', null, roadsAuthToken);
    const foundInRoads = roadsQueue.data.data.complaints.some((c) => c.id === roadComplaint.id);
    if (foundInRoads) {
      console.log('  ✓ Roads Authority CAN see Roads & Potholes complaint in queue');
    } else {
      throw new Error('Roads Authority could not find complaint in its jurisdiction!');
    }

    // General authority (Municipal Operations) SHOULD see all complaints
    const generalQueue = await makeRequest('GET', '/api/authority/complaints', null, generalAuthToken);
    const foundInGeneral = generalQueue.data.data.complaints.some((c) => c.id === roadComplaint.id);
    if (foundInGeneral) {
      console.log('  ✓ General Authority (Universal Jurisdiction) CAN see all complaints');
    } else {
      throw new Error('General Authority failed to see complaint!');
    }

    // 5. Test Cross-Jurisdiction Mutation Protection
    console.log('\n[TEST 4] Cross-Jurisdiction Mutation Rejection');
    const illegalStatusChange = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${roadComplaint.id}/status`,
      { status: 'IN_PROGRESS', notes: 'Water authority trying to update road' },
      waterAuthToken
    );
    if (illegalStatusChange.status === 403) {
      console.log('  ✓ 403 Forbidden: Water Authority rejected when updating Roads complaint');
    } else {
      throw new Error(`Expected 403, got ${illegalStatusChange.status}`);
    }

    // 6. Test Priority Escalation by Authorized Authority
    console.log('\n[TEST 5] Priority Escalation & Audit History');
    const priorityRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${roadComplaint.id}/priority`,
      { priority: 'CRITICAL', notes: 'Multiple tire punctures reported. High urgency.' },
      roadsAuthToken
    );
    if (priorityRes.status === 200 && priorityRes.data.data.priority === 'CRITICAL') {
      console.log('  ✓ Priority escalated to CRITICAL');
    } else {
      throw new Error(`Failed to escalate priority: ${JSON.stringify(priorityRes.data)}`);
    }

    // 7. Test Worker Assignment
    console.log('\n[TEST 6] Worker Assignment');
    // A: Invalid worker (citizen ID instead of worker)
    const invalidWorkerRes = await makeRequest(
      'POST',
      `/api/authority/complaints/${roadComplaint.id}/assign-worker`,
      { workerId: citizenUser.id, notes: 'Invalid assignment' },
      roadsAuthToken
    );
    if (invalidWorkerRes.status === 400) {
      console.log('  ✓ 400 Bad Request: Assignment rejected when user role is not WORKER');
    } else {
      throw new Error(`Expected 400 for non-worker, got ${invalidWorkerRes.status}`);
    }

    // B: Valid worker assignment
    const assignRes = await makeRequest(
      'POST',
      `/api/authority/complaints/${roadComplaint.id}/assign-worker`,
      { workerId: workerUser.id, notes: 'Deploy crew with asphalt mix.' },
      roadsAuthToken
    );
    if (assignRes.status === 200) {
      const updated = assignRes.data.data;
      console.log(`  ✓ Assigned worker: ${updated.assignedWorker?.name}`);
      console.log(`  ✓ Status transitioned to: ${updated.status}`);
      if (updated.status !== 'ASSIGNED') {
        throw new Error(`Expected status 'ASSIGNED', got ${updated.status}`);
      }
      if (updated.assignedWorker?.id !== workerUser.id) {
        throw new Error('Assigned worker ID does not match target worker');
      }
    } else {
      throw new Error(`Failed to assign worker: ${JSON.stringify(assignRes.data)}`);
    }

    // 8. Test Status Update to RESOLVED
    console.log('\n[TEST 7] Status Update to RESOLVED');
    const resolveRes = await makeRequest(
      'PATCH',
      `/api/authority/complaints/${roadComplaint.id}/status`,
      { status: 'RESOLVED', notes: 'Roadway resurfacing completed.' },
      roadsAuthToken
    );
    if (resolveRes.status === 200) {
      const resolvedData = resolveRes.data.data;
      console.log(`  ✓ Status updated to: ${resolvedData.status}`);
      console.log(`  ✓ resolvedAt timestamp set: ${resolvedData.resolvedAt}`);
      if (!resolvedData.resolvedAt) {
        throw new Error('resolvedAt timestamp was not set upon RESOLVED transition');
      }
    } else {
      throw new Error(`Failed to resolve complaint: ${JSON.stringify(resolveRes.data)}`);
    }

    // 9. Verify Complete Complaint History / Timeline
    console.log('\n[TEST 8] Complaint Details & Chronological Timeline Verification');
    const detailsRes = await makeRequest('GET', `/api/authority/complaints/${roadComplaint.id}`, null, roadsAuthToken);
    if (detailsRes.status === 200) {
      const details = detailsRes.data.data;
      console.log(`  ✓ Complaint details loaded for ID: ${details.id}`);
      console.log(`  ✓ History entries count: ${details.history?.length}`);
      console.log(`  ✓ Frontend timeline events count: ${details.timeline?.length}`);

      // Check chronological order and actions
      const actions = details.history.map((h) => ({
        action: h.action,
        from: h.fromStatus,
        to: h.toStatus,
        actor: h.actor?.name,
        notes: h.notes,
      }));
      console.table(actions);

      if (details.history.length < 4) {
        throw new Error(`Expected at least 4 history records (CREATED, PRIORITY_CHANGE, ASSIGN_WORKER, STATUS_CHANGE), got ${details.history.length}`);
      }

      // Check password exclusion
      if (details.citizen?.password || details.assignedWorker?.password || details.assignedAuthority?.password) {
        throw new Error('Security violation: Password hash detected in response!');
      }
      console.log('  ✓ PASS: No password hashes exposed anywhere in complaint response');
    } else {
      throw new Error(`Failed to get complaint details: ${JSON.stringify(detailsRes.data)}`);
    }

    // 10. Test Worker Roster API
    console.log('\n[TEST 9] Worker Roster API: GET /api/authority/workers');
    const workersRes = await makeRequest('GET', '/api/authority/workers', null, roadsAuthToken);
    if (workersRes.status === 200 && Array.isArray(workersRes.data.data)) {
      console.log(`  ✓ Workers retrieved: ${workersRes.data.data.length} worker(s)`);
      const sampleWorker = workersRes.data.data[0];
      if (sampleWorker?.password) {
        throw new Error('Security violation: Password found in worker roster!');
      }
      console.log(`  ✓ Sample worker: ${sampleWorker?.name} (${sampleWorker?.department || 'No Dept'}) - Active: ${sampleWorker?.status}`);
    } else {
      throw new Error(`Failed to get workers: ${JSON.stringify(workersRes.data)}`);
    }

    console.log('\n🎉 ALL PHASE 5 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error);
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

