/**
 * Comprehensive Automated Verification Suite for Performance, Pagination, Search & Filters
 */
const http = require('http');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt.utils');

const PORT = 5015;
let server;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: encodeURI(path),
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('=== Starting CivicFix Performance, Pagination, Search & Filters Test Suite ===\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });

  try {
    const timestamp = Date.now();
    const defaultPassword = 'TestPassword@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // =========================================================================
    // SETUP: Create Actors
    // =========================================================================
    console.log('[SETUP] Creating and authenticating actors...');

    const adminEmail = `perf_admin_${timestamp}@civicfix.org`;
    const adminUser = await prisma.user.create({
      data: {
        name: 'Perf Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    const citizenEmail = `perf_citizen_${timestamp}@civicfix.org`;
    const citizenUser = await prisma.user.create({
      data: {
        name: 'Perf Citizen',
        email: citizenEmail,
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });
    const citizenToken = generateToken({ id: citizenUser.id, email: citizenUser.email, role: citizenUser.role });

    const workerEmail = `perf_worker_${timestamp}@civicfix.org`;
    const workerUser = await prisma.user.create({
      data: {
        name: 'Perf Worker Bob',
        email: workerEmail,
        password: passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        department: 'Roads & Potholes',
        workerProfile: {
          create: {
            department: 'Roads & Potholes',
            skills: 'Asphalt Paving, Heavy Machinery',
            isAvailable: true,
          },
        },
      },
    });
    const workerToken = generateToken({ id: workerUser.id, email: workerUser.email, role: workerUser.role });

    const authorityEmail = `perf_auth_${timestamp}@civicfix.org`;
    const authorityUser = await prisma.user.create({
      data: {
        name: 'Perf Officer Dave',
        email: authorityEmail,
        password: passwordHash,
        role: 'AUTHORITY',
        status: 'ACTIVE',
        department: 'Roads & Potholes',
      },
    });
    const authorityToken = generateToken({ id: authorityUser.id, email: authorityUser.email, role: authorityUser.role });

    // Seed 15 distinct complaints for pagination & filtering tests
    console.log('[SETUP] Seeding 15 sample complaints...');
    const categories = ['ROADS_POTHOLES', 'STREET_LIGHTS', 'WATER_SUPPLY', 'SANITATION_WASTE'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

    const createdComplaintIds = [];
    for (let i = 1; i <= 15; i++) {
      const c = await prisma.complaint.create({
        data: {
          title: `Sample Issue #${i} - ${i % 2 === 0 ? 'Urgent pothole damage' : 'Broken streetlight dark zone'}`,
          description: `Detailed description for issue number ${i} testing pagination search and filter performance.`,
          category: categories[i % categories.length],
          priority: priorities[i % priorities.length],
          status: statuses[i % statuses.length],
          location: `Area ${i}, Ward ${10 + (i % 5)}, Metro City`,
          citizenId: citizenUser.id,
          assignedWorkerId: i % 3 === 0 ? workerUser.id : null,
          assignedAuthorityId: authorityUser.id,
        },
      });
      createdComplaintIds.push(c.id);
    }
    console.log(`✓ Seeded ${createdComplaintIds.length} complaints for tests.\n`);

    // =========================================================================
    // SECTION 1: PAGINATION & METADATA FORMAT
    // =========================================================================
    console.log('--- SECTION 1: PAGINATION & RESPONSE STRUCTURE ---');

    // Test 1.1: Verify root pagination format: page, limit, total, totalPages
    const page1Res = await makeRequest('GET', '/api/complaints?page=1&limit=5', null, citizenToken);
    assert(page1Res.status === 200, 'Page 1 retrieved with 200 OK');
    assert(page1Res.data.success === true, 'Response success is true');
    assert(page1Res.data.pagination !== undefined, 'Root pagination object present');
    assert(page1Res.data.pagination.page === 1, 'Pagination page matches 1');
    assert(page1Res.data.pagination.limit === 5, 'Pagination limit matches 5');
    assert(page1Res.data.pagination.total >= 15, `Pagination total reflects seeded count (${page1Res.data.pagination.total})`);
    assert(page1Res.data.pagination.totalPages >= 3, `Total pages correctly calculated (${page1Res.data.pagination.totalPages})`);
    assert(page1Res.data.data.complaints.length === 5, 'Returned complaints length equals limit 5');
    assert(Array.isArray(page1Res.data.data.items), 'Generic items alias present and is array');

    // Test 1.2: Verify Page 2 pagination
    const page2Res = await makeRequest('GET', '/api/complaints?page=2&limit=5', null, citizenToken);
    assert(page2Res.status === 200, 'Page 2 retrieved with 200 OK');
    assert(page2Res.data.pagination.page === 2, 'Pagination page matches 2');
    assert(page2Res.data.data.complaints.length === 5, 'Page 2 returns 5 items');
    // Ensure page 1 and page 2 don't overlap
    const page1Ids = page1Res.data.data.complaints.map((c) => c.id);
    const page2Ids = page2Res.data.data.complaints.map((c) => c.id);
    const overlap = page1Ids.some((id) => page2Ids.includes(id));
    assert(!overlap, 'No ID overlap between Page 1 and Page 2');

    // Test 1.3: Pagination boundary checks (invalid values rejected with 400)
    const invalidPageRes = await makeRequest('GET', '/api/complaints?page=0', null, citizenToken);
    assert(invalidPageRes.status === 400, 'page=0 rejected with 400 Bad Request');

    const negativePageRes = await makeRequest('GET', '/api/complaints?page=-3', null, citizenToken);
    assert(negativePageRes.status === 400, 'page=-3 rejected with 400 Bad Request');

    const excessiveLimitRes = await makeRequest('GET', '/api/complaints?limit=999', null, citizenToken);
    assert(excessiveLimitRes.status === 400, 'limit=999 rejected with 400 Bad Request (ceiling enforced)');

    // =========================================================================
    // SECTION 2: SEARCH CAPABILITIES
    // =========================================================================
    console.log('\n--- SECTION 2: TEXT SEARCH CAPABILITIES ---');

    // Test 2.1: Complaint search by keyword in title
    const searchPotholeRes = await makeRequest('GET', '/api/complaints?search=pothole', null, citizenToken);
    assert(searchPotholeRes.status === 200, 'Search by keyword "pothole" succeeds with 200 OK');
    assert(searchPotholeRes.data.data.complaints.length > 0, 'Found complaints matching "pothole"');
    assert(
      searchPotholeRes.data.data.complaints.every((c) =>
        c.title.toLowerCase().includes('pothole') ||
        c.description.toLowerCase().includes('pothole') ||
        c.location.toLowerCase().includes('pothole')
      ),
      'All returned search results match query text'
    );

    // Test 2.2: Complaint search by location
    const searchLocationRes = await makeRequest('GET', '/api/complaints?search=Ward 11', null, citizenToken);
    assert(searchLocationRes.status === 200, 'Search by location succeeds');
    assert(
      searchLocationRes.data.data.complaints.every((c) =>
        c.location.includes('Ward 11') || c.title.includes('Ward 11') || c.description.includes('Ward 11')
      ),
      'Results contain queried ward/location'
    );

    // Test 2.3: Admin user search by name and email
    const searchUserRes = await makeRequest('GET', `/api/admin/users?search=${citizenEmail}`, null, adminToken);
    assert(searchUserRes.status === 200, 'Admin searched user by email');
    assert(searchUserRes.data.data.users.length === 1, 'Search returned exactly target user');
    assert(searchUserRes.data.data.users[0].email === citizenEmail, 'User email matches search term');

    // =========================================================================
    // SECTION 3: MULTI-VALUE ENUM FILTERING
    // =========================================================================
    console.log('\n--- SECTION 3: MULTI-VALUE ENUM FILTERING ---');

    // Test 3.1: Multi-status filtering
    const multiStatusRes = await makeRequest('GET', '/api/complaints?status=SUBMITTED,UNDER_REVIEW', null, citizenToken);
    assert(multiStatusRes.status === 200, 'Multi-status query (SUBMITTED,UNDER_REVIEW) returned 200');
    assert(multiStatusRes.data.data.complaints.length > 0, 'Returned non-empty list for multi-status');
    assert(
      multiStatusRes.data.data.complaints.every((c) => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status)),
      'Every returned complaint has status SUBMITTED or UNDER_REVIEW'
    );

    // Test 3.2: Multi-priority filtering
    const multiPriorityRes = await makeRequest('GET', '/api/complaints?priority=HIGH,CRITICAL', null, citizenToken);
    assert(multiPriorityRes.status === 200, 'Multi-priority query (HIGH,CRITICAL) returned 200');
    assert(
      multiPriorityRes.data.data.complaints.every((c) => ['HIGH', 'CRITICAL'].includes(c.priority)),
      'Every returned complaint has priority HIGH or CRITICAL'
    );

    // Test 3.3: Category filtering
    const categoryRes = await makeRequest('GET', '/api/complaints?category=ROADS_POTHOLES', null, citizenToken);
    assert(categoryRes.status === 200, 'Single category filter returned 200');
    assert(
      categoryRes.data.data.complaints.every((c) => c.category === 'ROADS_POTHOLES'),
      'Every complaint matches ROADS_POTHOLES'
    );

    // Test 3.4: Multi-category filtering
    const multiCategoryRes = await makeRequest('GET', '/api/complaints?category=ROADS_POTHOLES,STREET_LIGHTS', null, citizenToken);
    assert(multiCategoryRes.status === 200, 'Multi-category filter returned 200');
    assert(
      multiCategoryRes.data.data.complaints.every((c) => ['ROADS_POTHOLES', 'STREET_LIGHTS'].includes(c.category)),
      'Every complaint matches ROADS_POTHOLES or STREET_LIGHTS'
    );

    // Test 3.5: Invalid enum rejection
    const invalidStatusRes = await makeRequest('GET', '/api/complaints?status=NOT_A_REAL_STATUS', null, citizenToken);
    assert(invalidStatusRes.status === 400, 'Invalid status string rejected with 400 Bad Request');

    // =========================================================================
    // SECTION 4: DATE-RANGE FILTERING
    // =========================================================================
    console.log('\n--- SECTION 4: DATE-RANGE FILTERING ---');

    // Test 4.1: Date range covering today
    const todayStr = new Date().toISOString().split('T')[0];
    const dateRangeRes = await makeRequest('GET', `/api/complaints?startDate=2020-01-01&endDate=${todayStr}`, null, citizenToken);
    assert(dateRangeRes.status === 200, 'Date-range filter with startDate & endDate returned 200');
    assert(dateRangeRes.data.data.complaints.length > 0, 'Seeded complaints fall within date range');

    // Test 4.2: Date range in the past with no matches
    const pastDateRes = await makeRequest('GET', '/api/complaints?startDate=2000-01-01&endDate=2001-01-01', null, citizenToken);
    assert(pastDateRes.status === 200, 'Past date range query returned 200');
    assert(pastDateRes.data.data.complaints.length === 0, '0 complaints returned for historical out-of-range window');
    assert(pastDateRes.data.pagination.total === 0, 'Pagination total is 0');
    assert(pastDateRes.data.pagination.totalPages === 1, 'totalPages safely defaults to 1 on empty');

    // Test 4.3: Date range aliases from/to
    const fromToRes = await makeRequest('GET', `/api/complaints?from=2020-01-01&to=${todayStr}`, null, citizenToken);
    assert(fromToRes.status === 200, 'Date-range aliases from/to returned 200');
    assert(fromToRes.data.data.complaints.length > 0, 'Complaints found using from/to parameters');

    // =========================================================================
    // SECTION 5: DYNAMIC SORTING
    // =========================================================================
    console.log('\n--- SECTION 5: DYNAMIC SORTING ---');

    // Test 5.1: Sort by createdAt ascending (oldest first)
    const sortAscRes = await makeRequest('GET', '/api/complaints?sortBy=createdAt&sortOrder=asc&limit=10', null, citizenToken);
    assert(sortAscRes.status === 200, 'Sort by createdAt asc returned 200');
    const ascDates = sortAscRes.data.data.complaints.map((c) => new Date(c.createdAt).getTime());
    const isAscSorted = ascDates.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(isAscSorted, 'Results verified strictly ascending by timestamp');

    // Test 5.2: Sort by createdAt descending (newest first)
    const sortDescRes = await makeRequest('GET', '/api/complaints?sortBy=createdAt&sortOrder=desc&limit=10', null, citizenToken);
    assert(sortDescRes.status === 200, 'Sort by createdAt desc returned 200');
    const descDates = sortDescRes.data.data.complaints.map((c) => new Date(c.createdAt).getTime());
    const isDescSorted = descDates.every((val, i, arr) => !i || arr[i - 1] >= val);
    assert(isDescSorted, 'Results verified strictly descending by timestamp');

    // Test 5.3: Sort by title ascending
    const sortTitleRes = await makeRequest('GET', '/api/complaints?sortBy=title&sortOrder=asc&limit=5', null, citizenToken);
    assert(sortTitleRes.status === 200, 'Sort by title asc returned 200');

    // Test 5.4: Disallowed sort field rejected with 400
    const invalidSortRes = await makeRequest('GET', '/api/complaints?sortBy=maliciousColumn;DROP', null, citizenToken);
    assert(invalidSortRes.status === 400, 'Disallowed sort field rejected with 400 Bad Request');

    // =========================================================================
    // SECTION 6: ROLE & WORKER SPECIFIC FILTERING
    // =========================================================================
    console.log('\n--- SECTION 6: ROLE & WORKER SPECIFIC FILTERING ---');

    // Test 6.1: Worker assigned complaints queue
    const workerQueueRes = await makeRequest('GET', '/api/worker/complaints?page=1&limit=5', null, workerToken);
    assert(workerQueueRes.status === 200, 'Worker listed assigned complaints');
    assert(workerQueueRes.data.pagination !== undefined, 'Worker response includes root pagination metadata');
    assert(
      workerQueueRes.data.data.complaints.every((c) => c.assignedWorkerId === workerUser.id),
      'Worker only receives tasks assigned to themselves'
    );

    // Test 6.2: Admin users multi-role and status filter
    const adminUsersRes = await makeRequest('GET', '/api/admin/users?role=WORKER,CITIZEN&status=ACTIVE&limit=10', null, adminToken);
    assert(adminUsersRes.status === 200, 'Admin listed users with multi-role and status filter');
    assert(adminUsersRes.data.pagination !== undefined, 'Admin users response includes pagination');
    assert(
      adminUsersRes.data.data.users.every((u) => ['WORKER', 'CITIZEN'].includes(u.role) && u.status === 'ACTIVE'),
      'All users match role filter and active status'
    );

    // Test 6.3: Notifications pagination & filtering
    const notifRes = await makeRequest('GET', '/api/notifications?page=1&limit=10', null, citizenToken);
    assert(notifRes.status === 200, 'Notifications retrieved with 200 OK');
    assert(notifRes.data.pagination !== undefined, 'Notifications includes root pagination');
    assert(notifRes.data.pagination.page === 1, 'Notifications page is 1');

    // =========================================================================
    // SECTION 7: DATABASE QUERY PERFORMANCE BENCHMARK
    // =========================================================================
    console.log('\n--- SECTION 7: QUERY PERFORMANCE BENCHMARK ---');

    const startPerf = Date.now();
    const benchmarkRes = await makeRequest(
      'GET',
      '/api/complaints?category=ROADS_POTHOLES&status=SUBMITTED&priority=CRITICAL,HIGH&limit=10',
      null,
      citizenToken
    );
    const elapsed = Date.now() - startPerf;

    assert(benchmarkRes.status === 200, 'Complex composite query returned 200 OK');
    console.log(`  ✓ Complex composite query executed in ${elapsed}ms (indexed lookup)`);
    assert(elapsed < 200, `Query execution is fast (<200ms), actual: ${elapsed}ms`);

    console.log('\n=========================================================================');
    console.log('  ALL PERFORMANCE, PAGINATION, SEARCH & FILTER TESTS PASSED SUCCESSFULLY');
    console.log('=========================================================================');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  if (server) {
    server.close();
  }
  process.exit(1);
});
