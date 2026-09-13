const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('./src/app');
const prisma = require('./src/config/db');

const TEST_PORT = 5013;
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

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

async function runTests() {
  const server = app.listen(TEST_PORT);
  await new Promise((resolve) => server.once('listening', resolve));
  console.log(`[TEST SERVER] Running on port ${TEST_PORT}\n`);

  try {
    const timestamp = Date.now();
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // =========================================================================
    // SETUP: Create Actors
    // =========================================================================
    console.log('[SETUP] Creating and authenticating actors...');

    // 1. Admin Actor
    const adminEmail = `admin_test_${timestamp}@test.com`;
    const adminUser = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: adminEmail,
      password: defaultPassword,
    });
    const adminToken = adminLogin.data.data.token;
    assert(adminToken, 'Admin logged in and obtained JWT');

    // 2. Citizen Actor
    const citizenEmail = `citizen_test_${timestamp}@test.com`;
    const citizenReg = await makeRequest('POST', '/api/auth/register', {
      name: 'Bob Citizen',
      email: citizenEmail,
      password: defaultPassword,
    });
    const citizenToken = citizenReg.data.data.token;
    const citizenId = citizenReg.data.data.user.id;
    assert(citizenToken, 'Citizen registered and obtained JWT');

    // 3. Worker Actor
    const workerEmail = `worker_test_${timestamp}@test.com`;
    const workerUser = await prisma.user.create({
      data: {
        name: 'Dave Worker',
        email: workerEmail,
        password: passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        department: 'Sanitation & Solid Waste',
        workerProfile: {
          create: {
            department: 'Sanitation & Solid Waste',
            skills: 'Waste Management, Heavy Hauling',
            isAvailable: true,
          },
        },
      },
    });

    const workerLogin = await makeRequest('POST', '/api/auth/login', {
      email: workerEmail,
      password: defaultPassword,
    });
    const workerToken = workerLogin.data.data.token;
    assert(workerToken, 'Worker logged in and obtained JWT');

    // 4. Authority Actor
    const authorityEmail = `authority_test_${timestamp}@test.com`;
    const authorityUser = await prisma.user.create({
      data: {
        name: 'Officer Davis',
        email: authorityEmail,
        password: passwordHash,
        role: 'AUTHORITY',
        status: 'ACTIVE',
        department: 'Sanitation & Solid Waste',
        zone: 'North Zone',
      },
    });

    const authorityLogin = await makeRequest('POST', '/api/auth/login', {
      email: authorityEmail,
      password: defaultPassword,
    });
    const authorityToken = authorityLogin.data.data.token;
    assert(authorityToken, 'Authority logged in and obtained JWT');

    console.log('\n--- SECTION 1: ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT ---');

    // Test 1.1: Unauthenticated request rejected
    const unauthRes = await makeRequest('GET', '/api/admin/users');
    assert(unauthRes.status === 401, 'Unauthenticated access to /api/admin/users blocked with 401');

    // Test 1.2: Citizen rejected with 403
    const citizenAdminRes = await makeRequest('GET', '/api/admin/users', null, citizenToken);
    assert(citizenAdminRes.status === 403, 'Citizen access to /api/admin/users blocked with 403');

    // Test 1.3: Worker rejected with 403
    const workerAdminRes = await makeRequest('GET', '/api/admin/complaints', null, workerToken);
    assert(workerAdminRes.status === 403, 'Worker access to /api/admin/complaints blocked with 403');

    // Test 1.4: Authority rejected with 403
    const authorityAdminRes = await makeRequest('GET', '/api/admin/stats', null, authorityToken);
    assert(authorityAdminRes.status === 403, 'Authority access to /api/admin/stats blocked with 403');

    // Test 1.5: Admin allowed with 200
    const adminAllowedRes = await makeRequest('GET', '/api/admin/stats', null, adminToken);
    assert(adminAllowedRes.status === 200, 'Admin access to /api/admin/stats authorized with 200');

    console.log('\n--- SECTION 2: USER MANAGEMENT ---');

    // Test 2.1: List users with pagination and role filter
    const listUsersRes = await makeRequest('GET', '/api/admin/users?role=CITIZEN&limit=10', null, adminToken);
    assert(listUsersRes.status === 200, 'Admin listed users with role filter');
    assert(listUsersRes.data.data.users.length > 0, 'Returned user list non-empty');
    assert(listUsersRes.data.data.users.every((u) => u.role === 'CITIZEN'), 'All filtered users have role CITIZEN');
    assert(!listUsersRes.data.data.users[0].password, 'Password field properly stripped from user data');

    // Test 2.2: Search users by keyword
    const searchUsersRes = await makeRequest('GET', `/api/admin/users?search=${citizenEmail}`, null, adminToken);
    assert(searchUsersRes.status === 200, 'Admin searched users by email');
    assert(searchUsersRes.data.data.users.length === 1, 'Search returned exactly 1 matching user');

    // Test 2.3: Get specific user details
    const getUserRes = await makeRequest('GET', `/api/admin/users/${citizenId}`, null, adminToken);
    assert(getUserRes.status === 200, 'Admin retrieved citizen details');
    assert(getUserRes.data.data.id === citizenId, 'Fetched user ID matches target');
    assert(getUserRes.data.data._count !== undefined, 'User includes activity counts summary');

    // Test 2.4: Admin creates new staff user (Authority)
    const newStaffEmail = `new_authority_${timestamp}@test.com`;
    const createStaffRes = await makeRequest('POST', '/api/admin/users', {
      name: 'Commissioner Gordon',
      email: newStaffEmail,
      password: defaultPassword,
      role: 'AUTHORITY',
      department: 'Roads & Infrastructure',
      designation: 'Executive Engineer',
      zone: 'Central Zone',
    }, adminToken);
    assert(createStaffRes.status === 201, 'Admin created new staff user with 201 Created');
    const newStaffId = createStaffRes.data.data.id;
    assert(createStaffRes.data.data.role === 'AUTHORITY', 'Staff user created with correct role AUTHORITY');
    assert(!createStaffRes.data.data.password, 'Password field not returned in response');

    // Test 2.5: Admin deactivates and reactivates staff user
    const deactivateRes = await makeRequest('PATCH', `/api/admin/users/${newStaffId}/status`, {
      status: 'INACTIVE',
      reason: 'Under internal administrative review',
    }, adminToken);
    assert(deactivateRes.status === 200, 'Staff user status updated to INACTIVE');
    assert(deactivateRes.data.data.status === 'INACTIVE', 'User status confirmed INACTIVE');

    const reactivateRes = await makeRequest('PATCH', `/api/admin/users/${newStaffId}/status`, {
      status: 'ACTIVE',
      reason: 'Administrative review cleared',
    }, adminToken);
    assert(reactivateRes.status === 200, 'Staff user status restored to ACTIVE');
    assert(reactivateRes.data.data.status === 'ACTIVE', 'User status confirmed ACTIVE');

    // Test 2.6: Self-deactivation prevention
    const selfDeactRes = await makeRequest('PATCH', `/api/admin/users/${adminUser.id}/status`, {
      status: 'INACTIVE',
    }, adminToken);
    assert(selfDeactRes.status === 400, 'Self-deactivation prevented with 400 Bad Request');
    assert(selfDeactRes.data.message.includes('cannot deactivate their own account'), 'Appropriate error message for self-deactivation');

    // Test 2.7: Role modification (Promote user to WORKER)
    const roleChangeRes = await makeRequest('PATCH', `/api/admin/users/${citizenId}/role`, {
      role: 'WORKER',
      department: 'Electrical Division & Lights',
      designation: 'Senior Electrician',
    }, adminToken);
    assert(roleChangeRes.status === 200, 'User role updated to WORKER');
    assert(roleChangeRes.data.data.role === 'WORKER', 'Role confirmed WORKER');

    // Verify workerProfile was automatically upserted
    const workerProfileCheck = await prisma.workerProfile.findUnique({
      where: { userId: citizenId },
    });
    assert(workerProfileCheck !== null, 'WorkerProfile record automatically generated upon promotion');

    // Test 2.8: Self-demotion prevention
    const selfDemoteRes = await makeRequest('PATCH', `/api/admin/users/${adminUser.id}/role`, {
      role: 'CITIZEN',
    }, adminToken);
    assert(selfDemoteRes.status === 400, 'Self-demotion prevented with 400 Bad Request');
    assert(selfDemoteRes.data.message.includes('cannot demote their own role'), 'Appropriate error message for self-demotion');

    console.log('\n--- SECTION 3: COMPLAINT MANAGEMENT & OVERRIDES ---');

    // Test 3.1: Citizen submits a complaint
    const submitComplaintRes = await makeRequest('POST', '/api/complaints', {
      title: 'Major pothole near Central Library',
      description: 'Dangerous pothole damaging vehicles on Main Avenue',
      category: 'ROADS_POTHOLES',
      priority: 'MEDIUM',
      location: '123 Main Avenue, Central District',
      latitude: 12.9716,
      longitude: 77.5946,
    }, citizenToken);
    assert(submitComplaintRes.status === 201, 'Citizen submitted test complaint');
    const complaintId = submitComplaintRes.data.data.id;

    // Test 3.2: Admin lists complaints with filtering
    const listComplaintsRes = await makeRequest('GET', `/api/admin/complaints?category=ROADS_POTHOLES`, null, adminToken);
    assert(listComplaintsRes.status === 200, 'Admin listed complaints with category filter');
    assert(listComplaintsRes.data.data.complaints.some((c) => c.id === complaintId), 'Submitted complaint present in list');

    // Test 3.3: Admin views complaint details
    const getComplaintRes = await makeRequest('GET', `/api/admin/complaints/${complaintId}`, null, adminToken);
    assert(getComplaintRes.status === 200, 'Admin viewed complaint details');
    assert(getComplaintRes.data.data.id === complaintId, 'Fetched complaint ID matches');

    // Test 3.4: Admin overrides priority
    const overridePriorityRes = await makeRequest('PATCH', `/api/admin/complaints/${complaintId}/priority`, {
      priority: 'CRITICAL',
      notes: 'Priority elevated by administrator due to traffic hazard',
    }, adminToken);
    assert(overridePriorityRes.status === 200, 'Admin overrode complaint priority');
    assert(overridePriorityRes.data.data.priority === 'CRITICAL', 'Complaint priority updated to CRITICAL');

    // Test 3.5: Admin overrides status
    const overrideStatusRes = await makeRequest('PATCH', `/api/admin/complaints/${complaintId}/status`, {
      status: 'UNDER_REVIEW',
      notes: 'Status fast-tracked to UNDER_REVIEW by administrator',
    }, adminToken);
    assert(overrideStatusRes.status === 200, 'Admin overrode complaint status');
    assert(overrideStatusRes.data.data.status === 'UNDER_REVIEW', 'Complaint status updated to UNDER_REVIEW');

    // Test 3.6: Admin views complaint history audit trail
    const getHistoryRes = await makeRequest('GET', `/api/admin/complaints/${complaintId}/history`, null, adminToken);
    assert(getHistoryRes.status === 200, 'Admin retrieved complaint history');
    const historyEntries = getHistoryRes.data.data;
    assert(historyEntries.length >= 2, 'History contains multiple timeline events');
    const hasAdminOverride = historyEntries.some((h) => h.action === 'ADMIN_OVERRIDE');
    const hasPriorityChange = historyEntries.some((h) => h.action === 'PRIORITY_CHANGE');
    assert(hasAdminOverride, 'History contains ADMIN_OVERRIDE action entry');
    assert(hasPriorityChange, 'History contains PRIORITY_CHANGE action entry');

    // Test 3.7: Admin deletes temporary complaint
    const tempComplaint = await prisma.complaint.create({
      data: {
        title: 'Spam complaint to delete',
        description: 'Testing administrative purge',
        category: 'OTHER',
        citizenId: citizenId,
        location: 'Temp location for purge test',
      },
    });
    const deleteRes = await makeRequest('DELETE', `/api/admin/complaints/${tempComplaint.id}`, {
      reason: 'Spam test ticket deletion',
    }, adminToken);
    assert(deleteRes.status === 200, 'Admin permanently deleted complaint');

    const verifyDeleted = await prisma.complaint.findUnique({ where: { id: tempComplaint.id } });
    assert(verifyDeleted === null, 'Complaint verified deleted from database');

    console.log('\n--- SECTION 4: WORKER MANAGEMENT & WORKLOAD METRICS ---');

    // Test 4.1: List workers with computed workload
    const listWorkersRes = await makeRequest('GET', '/api/admin/workers', null, adminToken);
    assert(listWorkersRes.status === 200, 'Admin listed workers with workload metrics');
    assert(listWorkersRes.data.data.workers.length > 0, 'Worker roster non-empty');
    const sampleWorker = listWorkersRes.data.data.workers[0];
    assert(typeof sampleWorker.activeTasks === 'number', 'Worker includes activeTasks metric');
    assert(typeof sampleWorker.completedTasks === 'number', 'Worker includes completedTasks metric');
    assert(typeof sampleWorker.totalAssigned === 'number', 'Worker includes totalAssigned metric');

    // Test 4.2: Update worker status / availability
    const updateWorkerStatusRes = await makeRequest('PATCH', `/api/admin/workers/${workerUser.id}/status`, {
      isAvailable: false,
      reason: 'On medical leave',
    }, adminToken);
    assert(updateWorkerStatusRes.status === 200, 'Admin updated worker availability');
    assert(updateWorkerStatusRes.data.data.workerProfile.isAvailable === false, 'Worker availability confirmed false');

    // Test 4.3: Update worker profile details
    const updateWorkerProfileRes = await makeRequest('PUT', `/api/admin/workers/${workerUser.id}/profile`, {
      skills: 'Sanitation, Hazardous Material, Fleet Driving',
      vehicleNumber: 'KA-01-M-9999',
      currentZone: 'East Zone',
      isAvailable: true,
    }, adminToken);
    assert(updateWorkerProfileRes.status === 200, 'Admin updated worker profile');
    assert(updateWorkerProfileRes.data.data.workerProfile.vehicleNumber === 'KA-01-M-9999', 'Vehicle number updated');
    assert(updateWorkerProfileRes.data.data.workerProfile.isAvailable === true, 'Worker availability restored to true');

    console.log('\n--- SECTION 5: AUTHORITY MANAGEMENT & DEPARTMENTS ---');

    // Test 5.1: List authorities with active caseloads
    const listAuthoritiesRes = await makeRequest('GET', '/api/admin/authorities', null, adminToken);
    assert(listAuthoritiesRes.status === 200, 'Admin listed authorities with caseload counts');
    assert(listAuthoritiesRes.data.data.authorities.length > 0, 'Authority list non-empty');
    const sampleAuthority = listAuthoritiesRes.data.data.authorities[0];
    assert(typeof sampleAuthority.activeCaseload === 'number', 'Authority includes activeCaseload count');

    // Test 5.2: Get departmental coverage overview
    const getDeptsRes = await makeRequest('GET', '/api/admin/departments', null, adminToken);
    assert(getDeptsRes.status === 200, 'Admin retrieved departments overview');
    assert(Array.isArray(getDeptsRes.data.data), 'Departments response is an array');
    assert(getDeptsRes.data.data.length >= 7, 'Returned all primary municipal departments');

    // Test 5.3: Update authority jurisdiction
    const updateJurisdictionRes = await makeRequest('PATCH', `/api/admin/authorities/${authorityUser.id}/department`, {
      department: 'Drainage & Sewage Board',
      zone: 'South Zone',
      designation: 'Senior Inspector',
      reason: 'Transferred to southern sector',
    }, adminToken);
    assert(updateJurisdictionRes.status === 200, 'Admin updated authority jurisdiction');
    assert(updateJurisdictionRes.data.data.department === 'Drainage & Sewage Board', 'Authority department updated');
    assert(updateJurisdictionRes.data.data.zone === 'South Zone', 'Authority zone updated');

    console.log('\n--- SECTION 6: SYSTEM STATISTICS DASHBOARD ---');

    // Test 6.1: Get system-wide platform statistics
    const getStatsRes = await makeRequest('GET', '/api/admin/stats', null, adminToken);
    assert(getStatsRes.status === 200, 'Admin retrieved system statistics dashboard');
    const stats = getStatsRes.data.data;
    assert(typeof stats.users.total === 'number' && stats.users.total > 0, 'System stats contains total users count');
    assert(stats.users.byRole.ADMIN >= 1, 'System stats contains users by role');
    assert(typeof stats.complaints.total === 'number', 'System stats contains total complaints count');
    assert(typeof stats.complaints.resolutionRate === 'number', 'System stats contains resolution rate');
    assert(typeof stats.assignments.total === 'number', 'System stats contains assignments count');

    console.log('\n--- SECTION 7: AUDIT LOGGING TRAIL ---');

    // Test 7.1: Retrieve administrative audit logs
    const getAuditLogsRes = await makeRequest('GET', '/api/admin/audit-logs', null, adminToken);
    assert(getAuditLogsRes.status === 200, 'Admin retrieved audit logs');
    const logs = getAuditLogsRes.data.data.logs;
    assert(logs.length > 0, 'Audit log trail non-empty');

    // Verify specific actions were logged
    const actionsLogged = logs.map((l) => l.action);
    console.log(`  Actions recorded in audit log: ${[...new Set(actionsLogged)].join(', ')}`);

    assert(actionsLogged.includes('USER_CREATE'), 'Audit log captured USER_CREATE');
    assert(actionsLogged.includes('USER_STATUS_CHANGE'), 'Audit log captured USER_STATUS_CHANGE');
    assert(actionsLogged.includes('USER_ROLE_CHANGE'), 'Audit log captured USER_ROLE_CHANGE');
    assert(actionsLogged.includes('COMPLAINT_PRIORITY_OVERRIDE'), 'Audit log captured COMPLAINT_PRIORITY_OVERRIDE');
    assert(actionsLogged.includes('COMPLAINT_STATUS_OVERRIDE'), 'Audit log captured COMPLAINT_STATUS_OVERRIDE');
    assert(actionsLogged.includes('COMPLAINT_DELETE'), 'Audit log captured COMPLAINT_DELETE');
    assert(actionsLogged.includes('WORKER_STATUS_CHANGE'), 'Audit log captured WORKER_STATUS_CHANGE');
    assert(actionsLogged.includes('WORKER_PROFILE_UPDATE'), 'Audit log captured WORKER_PROFILE_UPDATE');
    assert(actionsLogged.includes('AUTHORITY_JURISDICTION_UPDATE'), 'Audit log captured AUTHORITY_JURISDICTION_UPDATE');

    console.log('\n=============================================================');
    console.log('ALL ADMIN MODULE TESTS PASSED PERFECTLY!');
    console.log('=============================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});
