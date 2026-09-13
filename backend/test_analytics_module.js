const http = require('http');
const bcrypt = require('bcryptjs');
const app = require('./src/app');
const prisma = require('./src/config/db');

const TEST_PORT = 5014;
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
    const adminEmail = `admin_analytics_${timestamp}@test.com`;
    const adminUser = await prisma.user.create({
      data: {
        name: 'Analytics Admin',
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
    const citizenEmail = `citizen_analytics_${timestamp}@test.com`;
    const citizenUser = await prisma.user.create({
      data: {
        name: 'Analytics Citizen',
        email: citizenEmail,
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });

    const citizenLogin = await makeRequest('POST', '/api/auth/login', {
      email: citizenEmail,
      password: defaultPassword,
    });
    const citizenToken = citizenLogin.data.data.token;
    assert(citizenToken, 'Citizen logged in and obtained JWT');

    // 3. Authority Actor (Sanitation Department)
    const authorityEmail = `authority_analytics_${timestamp}@test.com`;
    const authorityUser = await prisma.user.create({
      data: {
        name: 'Sanitation Officer',
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

    // 4. Worker Actor
    const workerEmail = `worker_analytics_${timestamp}@test.com`;
    const workerUser = await prisma.user.create({
      data: {
        name: 'Sanitation Worker',
        email: workerEmail,
        password: passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        department: 'Sanitation & Solid Waste',
        workerProfile: {
          create: {
            department: 'Sanitation & Solid Waste',
            skills: 'Garbage Disposal, Recycling',
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

    // =========================================================================
    // SEED TEST COMPLAINTS
    // =========================================================================
    console.log('[SETUP] Seeding representative complaint datasets...');

    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000);

    // Complaint 1: SUBMITTED (Pending)
    await prisma.complaint.create({
      data: {
        title: 'Overflowing dumpster in Sector 4',
        description: 'Trash has not been cleared for two days.',
        category: 'SANITATION_WASTE',
        priority: 'HIGH',
        status: 'SUBMITTED',
        location: 'Sector 4 Community Center',
        citizenId: citizenUser.id,
      },
    });

    // Complaint 2: IN_PROGRESS (Active)
    await prisma.complaint.create({
      data: {
        title: 'Illegal dumping on 5th Cross',
        description: 'Construction debris dumped overnight.',
        category: 'SANITATION_WASTE',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        location: '5th Cross, Main Road',
        citizenId: citizenUser.id,
        assignedWorkerId: workerUser.id,
        assignedAuthorityId: authorityUser.id,
        taskStatus: 'IN_PROGRESS',
      },
    });

    // Complaint 3: RESOLVED with feedback and timestamps
    await prisma.complaint.create({
      data: {
        title: 'Broken waste bin replaced',
        description: 'Bin lid was cracked and smelling.',
        category: 'SANITATION_WASTE',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        location: 'Near Public Park',
        citizenId: citizenUser.id,
        assignedWorkerId: workerUser.id,
        assignedAuthorityId: authorityUser.id,
        taskStatus: 'COMPLETED',
        createdAt: twoHoursAgo,
        resolvedAt: new Date(),
        feedback: { rating: 5, comment: 'Quick replacement!' },
      },
    });

    // Complaint 4: CLOSED with timestamps
    await prisma.complaint.create({
      data: {
        title: 'Street sweep completed',
        description: 'Routine cleaning request fulfilled.',
        category: 'SANITATION_WASTE',
        priority: 'LOW',
        status: 'CLOSED',
        location: 'Avenue 2',
        citizenId: citizenUser.id,
        assignedWorkerId: workerUser.id,
        assignedAuthorityId: authorityUser.id,
        taskStatus: 'COMPLETED',
        createdAt: fourHoursAgo,
        resolvedAt: new Date(),
      },
    });

    console.log('\n--- SECTION 1: CITIZEN DASHBOARD ANALYTICS ---');

    // Test 1.1: Citizen Analytics endpoint
    const citizenAnalyticsRes = await makeRequest('GET', '/api/analytics/citizen', null, citizenToken);
    assert(citizenAnalyticsRes.status === 200, 'GET /api/analytics/citizen returned 200 OK');
    const citizenData = citizenAnalyticsRes.data.data;
    assert(citizenData.role === 'CITIZEN', 'Response indicates role CITIZEN');
    assert(citizenData.summary.totalComplaints >= 4, 'summary.totalComplaints includes all citizen grievances');
    assert(citizenData.summary.pendingComplaints >= 1, 'summary.pendingComplaints matches SUBMITTED/UNDER_REVIEW');
    assert(citizenData.summary.inProgressComplaints >= 1, 'summary.inProgressComplaints matches active repairs');
    assert(citizenData.summary.resolvedComplaints >= 2, 'summary.resolvedComplaints matches RESOLVED + CLOSED');
    assert(Array.isArray(citizenData.kpis) && citizenData.kpis.length === 4, 'kpis array contains 4 formatted metric cards');
    assert(Array.isArray(citizenData.recentComplaints) && citizenData.recentComplaints.length > 0, 'recentComplaints stream returned');

    console.log('\n--- SECTION 2: AUTHORITY DASHBOARD ANALYTICS ---');

    // Test 2.1: Authority Analytics endpoint
    const authorityAnalyticsRes = await makeRequest('GET', '/api/analytics/authority', null, authorityToken);
    assert(authorityAnalyticsRes.status === 200, 'GET /api/analytics/authority returned 200 OK');
    const authorityData = authorityAnalyticsRes.data.data;
    assert(authorityData.role === 'AUTHORITY', 'Response indicates role AUTHORITY');
    assert(typeof authorityData.summary.totalComplaints === 'number', 'summary.totalComplaints is numeric');
    assert(typeof authorityData.summary.pending === 'number', 'summary.pending is numeric');
    assert(typeof authorityData.summary.assigned === 'number', 'summary.assigned is numeric');
    assert(typeof authorityData.summary.inProgress === 'number', 'summary.inProgress is numeric');
    assert(typeof authorityData.summary.resolved === 'number', 'summary.resolved is numeric');
    assert(typeof authorityData.summary.highPriority === 'number', 'summary.highPriority is numeric');
    assert(typeof authorityData.summary.avgResolutionHours === 'number', 'summary.avgResolutionHours is numeric from MySQL');
    assert(typeof authorityData.summary.averageResolutionTime === 'string', 'summary.averageResolutionTime is human formatted (e.g. X hrs)');
    assert(Array.isArray(authorityData.kpis) && authorityData.kpis.length >= 4, 'kpis array formatted for DashboardStats widget');
    assert(typeof authorityData.statusDistribution === 'object', 'statusDistribution map present');
    assert(typeof authorityData.categoryDistribution === 'object', 'categoryDistribution map present');

    // Test 2.2: Authority route aliases (/api/authority/analytics and /api/authority/stats)
    const authAliasRes1 = await makeRequest('GET', '/api/authority/analytics', null, authorityToken);
    assert(authAliasRes1.status === 200, 'GET /api/authority/analytics alias returned 200 OK');
    const authAliasRes2 = await makeRequest('GET', '/api/authority/stats', null, authorityToken);
    assert(authAliasRes2.status === 200, 'GET /api/authority/stats alias returned 200 OK');

    console.log('\n--- SECTION 3: WORKER DASHBOARD ANALYTICS ---');

    // Test 3.1: Worker Analytics endpoint
    const workerAnalyticsRes = await makeRequest('GET', '/api/analytics/worker', null, workerToken);
    assert(workerAnalyticsRes.status === 200, 'GET /api/analytics/worker returned 200 OK');
    const workerData = workerAnalyticsRes.data.data;
    assert(workerData.role === 'WORKER', 'Response indicates role WORKER');
    assert(typeof workerData.summary.assignedComplaints === 'number', 'summary.assignedComplaints is numeric');
    assert(typeof workerData.summary.activeComplaints === 'number', 'summary.activeComplaints is numeric');
    assert(typeof workerData.summary.completedComplaints === 'number', 'summary.completedComplaints is numeric');
    assert(typeof workerData.summary.workload.capacityLoadPercentage === 'number', 'workload.capacityLoadPercentage computed');
    assert(Array.isArray(workerData.kpis) && workerData.kpis.length >= 4, 'kpis array formatted for worker terminal');
    assert(Array.isArray(workerData.recentTasks), 'recentTasks stream returned');

    // Test 3.2: Worker route aliases (/api/worker/analytics and /api/worker/stats)
    const workerAliasRes1 = await makeRequest('GET', '/api/worker/analytics', null, workerToken);
    assert(workerAliasRes1.status === 200, 'GET /api/worker/analytics alias returned 200 OK');
    const workerAliasRes2 = await makeRequest('GET', '/api/worker/stats', null, workerToken);
    assert(workerAliasRes2.status === 200, 'GET /api/worker/stats alias returned 200 OK');

    console.log('\n--- SECTION 4: ADMIN DASHBOARD ANALYTICS & TIME-SERIES ---');

    // Test 4.1: Admin Analytics endpoint
    const adminAnalyticsRes = await makeRequest('GET', '/api/analytics/admin', null, adminToken);
    assert(adminAnalyticsRes.status === 200, 'GET /api/analytics/admin returned 200 OK');
    const adminData = adminAnalyticsRes.data.data;
    assert(adminData.role === 'ADMIN', 'Response indicates role ADMIN');

    // User breakdown
    assert(typeof adminData.summary.totalUsers === 'number' && adminData.summary.totalUsers >= 4, 'summary.totalUsers correct');
    assert(typeof adminData.summary.citizens === 'number' && adminData.summary.citizens >= 1, 'summary.citizens correct');
    assert(typeof adminData.summary.workers === 'number' && adminData.summary.workers >= 1, 'summary.workers correct');
    assert(typeof adminData.summary.authorities === 'number' && adminData.summary.authorities >= 1, 'summary.authorities correct');

    // Complaint breakdown
    assert(typeof adminData.summary.totalComplaints === 'number' && adminData.summary.totalComplaints >= 4, 'summary.totalComplaints correct');
    assert(typeof adminData.summary.resolvedComplaints === 'number' && adminData.summary.resolvedComplaints >= 2, 'summary.resolvedComplaints correct');
    assert(typeof adminData.summary.pendingComplaints === 'number', 'summary.pendingComplaints correct');
    assert(typeof adminData.summary.resolutionRateNumber === 'number', 'summary.resolutionRateNumber computed');
    assert(typeof adminData.summary.averageResolutionTime === 'string', 'summary.averageResolutionTime computed from MySQL');

    // Category and status aggregations
    assert(typeof adminData.complaintsByCategory === 'object', 'complaintsByCategory map present');
    assert(typeof adminData.complaintsByStatus === 'object', 'complaintsByStatus map present');
    assert(typeof adminData.complaintsByPriority === 'object', 'complaintsByPriority map present');

    // Monthly time-series
    assert(Array.isArray(adminData.complaintsOverTime), 'complaintsOverTime is an array for charts');
    assert(adminData.complaintsOverTime.length > 0, 'complaintsOverTime contains monthly aggregated records');
    const firstPeriod = adminData.complaintsOverTime[0];
    assert(typeof firstPeriod.period === 'string' && /^\d{4}-\d{2}$/.test(firstPeriod.period), 'period matches YYYY-MM format');
    assert(typeof firstPeriod.total === 'number', 'period total is numeric');
    assert(typeof firstPeriod.resolved === 'number', 'period resolved is numeric');

    // Test 4.2: Admin route alias (/api/admin/analytics)
    const adminAliasRes = await makeRequest('GET', '/api/admin/analytics', null, adminToken);
    assert(adminAliasRes.status === 200, 'GET /api/admin/analytics alias returned 200 OK');

    console.log('\n--- SECTION 5: UNIVERSAL SMART DASHBOARD ROUTE ---');

    // Test 5.1: Universal route as Citizen
    const uniCitizenRes = await makeRequest('GET', '/api/analytics/dashboard', null, citizenToken);
    assert(uniCitizenRes.status === 200, 'GET /api/analytics/dashboard as Citizen returned 200 OK');
    assert(uniCitizenRes.data.data.role === 'CITIZEN', 'Universal route returned Citizen dashboard');

    // Test 5.2: Universal route as Authority
    const uniAuthRes = await makeRequest('GET', '/api/analytics/dashboard', null, authorityToken);
    assert(uniAuthRes.status === 200, 'GET /api/analytics/dashboard as Authority returned 200 OK');
    assert(uniAuthRes.data.data.role === 'AUTHORITY', 'Universal route returned Authority dashboard');

    // Test 5.3: Universal route as Worker
    const uniWorkerRes = await makeRequest('GET', '/api/analytics/dashboard', null, workerToken);
    assert(uniWorkerRes.status === 200, 'GET /api/analytics/dashboard as Worker returned 200 OK');
    assert(uniWorkerRes.data.data.role === 'WORKER', 'Universal route returned Worker dashboard');

    // Test 5.4: Universal route as Admin
    const uniAdminRes = await makeRequest('GET', '/api/analytics/dashboard', null, adminToken);
    assert(uniAdminRes.status === 200, 'GET /api/analytics/dashboard as Admin returned 200 OK');
    assert(uniAdminRes.data.data.role === 'ADMIN', 'Universal route returned Admin dashboard');

    console.log('\n--- SECTION 6: RBAC & ACCESS CONTROL ENFORCEMENT ---');

    // Test 6.1: Unauthenticated request blocked
    const unauthRes = await makeRequest('GET', '/api/analytics/dashboard');
    assert(unauthRes.status === 401, 'Unauthenticated request blocked with 401 Unauthorized');

    // Test 6.2: Citizen blocked from Admin analytics
    const citizenAdminRes = await makeRequest('GET', '/api/analytics/admin', null, citizenToken);
    assert(citizenAdminRes.status === 403, 'Citizen blocked from /api/analytics/admin with 403 Forbidden');

    // Test 6.3: Worker blocked from Authority analytics
    const workerAuthRes = await makeRequest('GET', '/api/analytics/authority', null, workerToken);
    assert(workerAuthRes.status === 403, 'Worker blocked from /api/analytics/authority with 403 Forbidden');

    // Test 6.4: Authority blocked from Admin analytics
    const authAdminRes = await makeRequest('GET', '/api/analytics/admin', null, authorityToken);
    assert(authAdminRes.status === 403, 'Authority blocked from /api/analytics/admin with 403 Forbidden');

    // Test 6.5: Admin allowed on all specific analytics routes
    const adminCitizenRes = await makeRequest('GET', '/api/analytics/citizen', null, adminToken);
    assert(adminCitizenRes.status === 200, 'Admin can view citizen analytics');
    const adminAuthorityRes = await makeRequest('GET', '/api/analytics/authority', null, adminToken);
    assert(adminAuthorityRes.status === 200, 'Admin can view authority analytics');
    const adminWorkerRes = await makeRequest('GET', '/api/analytics/worker', null, adminToken);
    assert(adminWorkerRes.status === 200, 'Admin can view worker analytics');

    console.log('\n=============================================================');
    console.log('ALL ANALYTICS MODULE TESTS PASSED PERFECTLY!');
    console.log('=============================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR IN TEST SUITE]:', err);
  process.exit(1);
});

