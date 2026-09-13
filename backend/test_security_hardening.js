/**
 * Comprehensive Automated Verification Suite for CivicFix Security Hardening
 *
 * Tests:
 * 1. HTTP Security Headers (Helmet) & Request Size Limits
 * 2. Authentication Rate Limiting & Brute Force Protection (HTTP 429)
 * 3. User Profile IDOR Remediation (GET /api/users/:id)
 * 4. Complaint IDOR & Data Scoping (Citizen, Worker, Authority, Admin)
 * 5. Privilege Escalation & Role Tampering Protections
 * 6. File Upload Whitelist & Malicious Extension Blocking
 * 7. Sensitive Data Privacy (Zero Password / Secret Leakage)
 */

const http = require('http');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt.utils');

const PORT = 5020;
let server;

function makeRequest(method, path, body = null, token = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = { ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;
    if (body !== null) {
      if (typeof body === 'string') {
        payload = body;
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      } else {
        payload = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
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
            resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: rawData });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, raw: rawData });
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

async function runSecurityTests() {
  console.log('===============================================================');
  console.log('      CIVICFIX BACKEND SECURITY HARDENING VERIFICATION         ');
  console.log('===============================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[+] Security test server running on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  const testSuffix = Date.now();
  const hashedPassword = await bcrypt.hash('SecurePassword123!', 10);

  // Setup test users
  console.log('[+] Seeding isolated security test personas in database...');
  const citizenA = await prisma.user.create({
    data: {
      name: `Sec Citizen Alpha ${testSuffix}`,
      email: `citizen_a_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'CITIZEN',
      status: 'ACTIVE',
      phone: '9876543210',
      address: 'Sector 1 Alpha Road',
    },
  });

  const citizenB = await prisma.user.create({
    data: {
      name: `Sec Citizen Beta ${testSuffix}`,
      email: `citizen_b_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'CITIZEN',
      status: 'ACTIVE',
      phone: '9876543211',
      address: 'Sector 2 Beta Lane',
    },
  });

  const workerAssigned = await prisma.user.create({
    data: {
      name: `Sec Worker Assigned ${testSuffix}`,
      email: `worker_assigned_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'WORKER',
      status: 'ACTIVE',
      department: 'Water Supply & Sewerage',
    },
  });

  const workerOther = await prisma.user.create({
    data: {
      name: `Sec Worker Other ${testSuffix}`,
      email: `worker_other_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'WORKER',
      status: 'ACTIVE',
      department: 'Water Supply & Sewerage',
    },
  });

  const authorityWater = await prisma.user.create({
    data: {
      name: `Sec Authority Water ${testSuffix}`,
      email: `auth_water_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'AUTHORITY',
      status: 'ACTIVE',
      department: 'Water Supply & Sewerage',
    },
  });

  const authorityRoads = await prisma.user.create({
    data: {
      name: `Sec Authority Roads ${testSuffix}`,
      email: `auth_roads_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'AUTHORITY',
      status: 'ACTIVE',
      department: 'Roads & Highways',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: `Sec Super Admin ${testSuffix}`,
      email: `admin_${testSuffix}@security.org`,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Generate tokens
  const tokenCitizenA = generateToken(citizenA);
  const tokenCitizenB = generateToken(citizenB);
  const tokenWorkerAssigned = generateToken(workerAssigned);
  const tokenWorkerOther = generateToken(workerOther);
  const tokenAuthorityWater = generateToken(authorityWater);
  const tokenAuthorityRoads = generateToken(authorityRoads);
  const tokenAdmin = generateToken(adminUser);

  const bypassHeader = { 'x-bypass-rate-limit': 'test-suite-internal' };

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // =========================================================================
    // TEST 1: HTTP Security Headers via Helmet
    // =========================================================================
    console.log('\n--- 1. HTTP Security Headers (Helmet) ---');
    const headerRes = await makeRequest('GET', '/', null, null, bypassHeader);
    assert(headerRes.status === 200, 'Root endpoint responds with HTTP 200');
    assert(
      headerRes.headers['x-content-type-options'] === 'nosniff',
      `Header X-Content-Type-Options is 'nosniff'`
    );
    assert(
      headerRes.headers['x-frame-options'] === 'SAMEORIGIN',
      `Header X-Frame-Options is 'SAMEORIGIN' (Clickjacking defense)`
    );
    assert(
      headerRes.headers['cross-origin-resource-policy'] === 'cross-origin',
      `Cross-Origin-Resource-Policy allows cross-origin static image asset loading`
    );

    // =========================================================================
    // TEST 2: Request Size Limits (1MB Ceiling)
    // =========================================================================
    console.log('\n--- 2. Request Payload Size Limits ---');
    const largePayload = 'A'.repeat(1.2 * 1024 * 1024); // 1.2 MB string
    const sizeRes = await makeRequest(
      'POST',
      '/api/auth/login',
      JSON.stringify({ email: 'test@example.com', password: largePayload }),
      null,
      bypassHeader
    );
    assert(
      sizeRes.status === 413,
      `Payload exceeding 1MB is rejected with HTTP 413 Payload Too Large (Got ${sizeRes.status})`
    );

    // =========================================================================
    // TEST 3: Authentication Rate Limiting & Brute Force Defense
    // =========================================================================
    console.log('\n--- 3. Authentication Rate Limiting (Brute Force Defense) ---');
    console.log('   Sending 11 rapid authentication requests without bypass header...');
    let lastStatus = null;
    let rateLimited = false;

    for (let i = 1; i <= 11; i++) {
      const res = await makeRequest(
        'POST',
        '/api/auth/login',
        { email: `victim_${testSuffix}@civicfix.org`, password: 'WrongPassword!' },
        null,
        {} // No bypass header -> triggers authLimiter!
      );
      lastStatus = res.status;
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(
      rateLimited && lastStatus === 429,
      `Request 11 was blocked by rate limiter with HTTP 429 Too Many Requests (Got ${lastStatus})`
    );

    // =========================================================================
    // TEST 4: Broken Object Level Authorization (IDOR) on User Profile
    // =========================================================================
    console.log('\n--- 4. IDOR Defense: User Profile Access (GET /api/users/:id) ---');
    // Citizen A tries to view Citizen B's profile
    const idorProfileRes = await makeRequest(
      'GET',
      `/api/users/${citizenB.id}`,
      null,
      tokenCitizenA,
      bypassHeader
    );
    assert(
      idorProfileRes.status === 403,
      `Citizen A attempting to access Citizen B's profile is rejected with HTTP 403 Forbidden (Got ${idorProfileRes.status})`
    );

    // Citizen A views their own profile
    const ownProfileRes = await makeRequest(
      'GET',
      `/api/users/${citizenA.id}`,
      null,
      tokenCitizenA,
      bypassHeader
    );
    assert(
      ownProfileRes.status === 200 && ownProfileRes.data?.data?.id === citizenA.id,
      `Citizen A can access their own profile successfully (HTTP 200)`
    );

    // Admin views Citizen B's profile
    const adminViewProfileRes = await makeRequest(
      'GET',
      `/api/users/${citizenB.id}`,
      null,
      tokenAdmin,
      bypassHeader
    );
    assert(
      adminViewProfileRes.status === 200 && adminViewProfileRes.data?.data?.id === citizenB.id,
      `Admin can access user profile for administrative purposes (HTTP 200)`
    );

    // =========================================================================
    // TEST 5: Complaint IDOR & Department / Worker Data Isolation
    // =========================================================================
    console.log('\n--- 5. Complaint IDOR & Multi-Tenant Data Isolation ---');
    // Citizen A reports a water supply complaint
    const complaintA = await prisma.complaint.create({
      data: {
        title: `Sec Water Pipe Burst ${testSuffix}`,
        description: 'Underground high-pressure pipe rupture on Main Ave',
        category: 'WATER_SUPPLY',
        priority: 'HIGH',
        status: 'ASSIGNED',
        location: 'Main Avenue crossing 5th St',
        citizenId: citizenA.id,
        assignedWorkerId: workerAssigned.id,
      },
    });

    // 5a. Citizen B attempts to read Citizen A's complaint
    const idorComplaintRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenCitizenB,
      bypassHeader
    );
    assert(
      idorComplaintRes.status === 403,
      `Citizen B attempting to access Citizen A's complaint is rejected with HTTP 403 Forbidden (Got ${idorComplaintRes.status})`
    );

    // 5b. Citizen B attempts to read Citizen A's complaint timeline
    const idorTimelineRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}/timeline`,
      null,
      tokenCitizenB,
      bypassHeader
    );
    assert(
      idorTimelineRes.status === 403,
      `Citizen B attempting to access Citizen A's timeline is rejected with HTTP 403 Forbidden (Got ${idorTimelineRes.status})`
    );

    // 5c. Worker Assigned reads complaint A
    const workerAssignedRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenWorkerAssigned,
      bypassHeader
    );
    assert(
      workerAssignedRes.status === 200 && workerAssignedRes.data?.data?.id === complaintA.id,
      `Assigned Worker can view assigned complaint (HTTP 200)`
    );

    // 5d. Worker Other (unassigned) attempts to read complaint A
    const workerOtherRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenWorkerOther,
      bypassHeader
    );
    assert(
      workerOtherRes.status === 403,
      `Unassigned Worker attempting to access complaint is rejected with HTTP 403 Forbidden (Got ${workerOtherRes.status})`
    );

    // 5e. Authority Roads attempts to read Water Supply complaint (out of jurisdiction)
    const authRoadsRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenAuthorityRoads,
      bypassHeader
    );
    assert(
      authRoadsRes.status === 403,
      `Authority Roads attempting to access Water complaint is rejected with HTTP 403 Forbidden (Got ${authRoadsRes.status})`
    );

    // 5f. Authority Water reads Water Supply complaint (matching jurisdiction)
    const authWaterRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenAuthorityWater,
      bypassHeader
    );
    assert(
      authWaterRes.status === 200 && authWaterRes.data?.data?.id === complaintA.id,
      `Authority Water with matching jurisdiction accesses complaint (HTTP 200)`
    );

    // 5g. Super Admin reads complaint A
    const adminComplaintRes = await makeRequest(
      'GET',
      `/api/complaints/${complaintA.id}`,
      null,
      tokenAdmin,
      bypassHeader
    );
    assert(
      adminComplaintRes.status === 200 && adminComplaintRes.data?.data?.id === complaintA.id,
      `Super Admin accesses complaint (HTTP 200)`
    );

    // =========================================================================
    // TEST 6: Privilege Escalation & State Machine Enforcement
    // =========================================================================
    console.log('\n--- 6. Privilege Escalation & Role Defense ---');
    // 6a. Attempt to register directly with role 'ADMIN'
    const regEscalateRes = await makeRequest(
      'POST',
      '/api/auth/register',
      {
        name: `Attacker Escalation ${testSuffix}`,
        email: `attacker_${testSuffix}@exploit.net`,
        password: 'Password123!',
        role: 'ADMIN', // Tampered role claim
      },
      null,
      bypassHeader
    );
    assert(
      regEscalateRes.status === 201 && regEscalateRes.data?.data?.user?.role === 'CITIZEN',
      `Registration payload with role 'ADMIN' is forced strictly to role 'CITIZEN'`
    );

    // 6b. Citizen attempting to access Admin endpoints
    const citizenAdminRes = await makeRequest(
      'GET',
      '/api/admin/stats',
      null,
      tokenCitizenA,
      bypassHeader
    );
    assert(
      citizenAdminRes.status === 403,
      `Citizen attempting to access /api/admin/stats is rejected with HTTP 403 Forbidden (Got ${citizenAdminRes.status})`
    );

    // 6c. Worker attempting to access Admin endpoints
    const workerAdminRes = await makeRequest(
      'GET',
      '/api/admin/users',
      null,
      tokenWorkerAssigned,
      bypassHeader
    );
    assert(
      workerAdminRes.status === 403,
      `Worker attempting to access /api/admin/users is rejected with HTTP 403 Forbidden (Got ${workerAdminRes.status})`
    );

    // 6d. Citizen attempting unauthorized illegal status jump to RESOLVED
    const illegalJumpRes = await makeRequest(
      'PUT',
      `/api/complaints/${complaintA.id}`,
      { status: 'RESOLVED' },
      tokenCitizenA,
      bypassHeader
    );
    assert(
      illegalJumpRes.status === 400 || illegalJumpRes.status === 403,
      `Citizen attempting illegal jump to RESOLVED is rejected (HTTP ${illegalJumpRes.status})`
    );

    // =========================================================================
    // TEST 7: File Upload MIME & Extension Whitelist Security
    // =========================================================================
    console.log('\n--- 7. File Upload Security (Extension & MIME Filtering) ---');
    // Construct a multipart form boundary with an illegal .php filename
    const boundary = '----CivicFixSecurityBoundary' + testSuffix;
    const maliciousBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Hacked Complaint Title',
      `--${boundary}`,
      'Content-Disposition: form-data; name="description"',
      '',
      'Description testing upload exploits',
      `--${boundary}`,
      'Content-Disposition: form-data; name="category"',
      '',
      'ROADS_POTHOLES',
      `--${boundary}`,
      'Content-Disposition: form-data; name="location"',
      '',
      'Sector 9 Main Rd',
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="webshell.php"',
      'Content-Type: application/x-php',
      '',
      '<?php system($_GET["cmd"]); ?>',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const phpUploadRes = await makeRequest(
      'POST',
      '/api/complaints',
      maliciousBody,
      tokenCitizenA,
      {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'x-bypass-rate-limit': 'test-suite-internal',
      }
    );
    assert(
      phpUploadRes.status === 400,
      `Malicious .php upload attempt is rejected with HTTP 400 Bad Request (Got ${phpUploadRes.status})`
    );

    // Disguised MIME type (e.g. filename shell.php with image/jpeg)
    const spoofedBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Spoofed Complaint Title',
      `--${boundary}`,
      'Content-Disposition: form-data; name="description"',
      '',
      'Testing extension spoofing bypass',
      `--${boundary}`,
      'Content-Disposition: form-data; name="category"',
      '',
      'ROADS_POTHOLES',
      `--${boundary}`,
      'Content-Disposition: form-data; name="location"',
      '',
      'Sector 10 Elm St',
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="exploit.php"',
      'Content-Type: image/jpeg', // Spoofed MIME type
      '',
      'FAKE_JPEG_CONTENT',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const spoofedUploadRes = await makeRequest(
      'POST',
      '/api/complaints',
      spoofedBody,
      tokenCitizenA,
      {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'x-bypass-rate-limit': 'test-suite-internal',
      }
    );
    assert(
      spoofedUploadRes.status === 400,
      `Disguised .php with image/jpeg MIME is rejected by extension whitelist (HTTP 400, Got ${spoofedUploadRes.status})`
    );

    // =========================================================================
    // TEST 8: Sensitive Data Privacy & Credential Leakage Protection
    // =========================================================================
    console.log('\n--- 8. Sensitive Data Privacy (Zero Password / Secret Exposure) ---');
    const meRes = await makeRequest('GET', '/api/auth/me', null, tokenCitizenA, bypassHeader);
    const loginRes = await makeRequest(
      'POST',
      '/api/auth/login',
      { email: citizenA.email, password: 'SecurePassword123!' },
      null,
      bypassHeader
    );

    assert(
      !('password' in (meRes.data?.data || {})) &&
        !('password' in (loginRes.data?.data?.user || {})) &&
        !('password' in (ownProfileRes.data?.data || {})),
      `User password hash is NEVER exposed in /me, /login, or user profile responses`
    );

    // Clean up test complaint
    await prisma.complaint.delete({ where: { id: complaintA.id } });
  } catch (err) {
    console.error('[!] Unexpected test execution failure:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('[SUCCESS] All security hardening tests passed with zero vulnerabilities!\n');
    process.exit(0);
  }
}

runSecurityTests();

