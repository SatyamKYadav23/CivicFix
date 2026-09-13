/**
 * Comprehensive Automated Verification Suite for Phase 6: Worker System
 */
const http = require('http');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/db');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt.utils');

const PORT = 5010; // Dedicated test port
let server;

function makeRequest(method, path, body = null, token = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let payload = null;
    if (contentType === 'application/json' && body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (Buffer.isBuffer(body)) {
      payload = body;
      headers['Content-Type'] = contentType;
      headers['Content-Length'] = body.length;
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function buildMultipartFormData(boundary, fields, files = []) {
  const chunks = [];
  for (const [key, val] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
  }
  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
      )
    );
    chunks.push(file.buffer);
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

// Minimal 1x1 valid JPEG image buffer
const SAMPLE_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

async function runTests() {
  console.log('=== Starting CivicFix Phase 6: Worker System Verification ===\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST SERVER] Running on port ${PORT}`);
      resolve();
    });
  });

  try {
    const passwordHash = await bcrypt.hash('Test@1234', 10);

    // 1. Setup Test Users
    console.log('[SETUP] Initializing test users and profiles...');
    const citizenUser = await prisma.user.upsert({
      where: { email: 'phase6_citizen@civicfix.org' },
      update: { role: 'CITIZEN', status: 'ACTIVE' },
      create: {
        name: 'Phase6 Citizen',
        email: 'phase6_citizen@civicfix.org',
        password: passwordHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
      },
    });

    const authorityUser = await prisma.user.upsert({
      where: { email: 'phase6_authority@civicfix.org' },
      update: { role: 'AUTHORITY', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Roads Chief Inspector',
        email: 'phase6_authority@civicfix.org',
        password: passwordHash,
        role: 'AUTHORITY',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const worker1 = await prisma.user.upsert({
      where: { email: 'phase6_worker1@civicfix.org' },
      update: { role: 'WORKER', department: 'Roads & Potholes', status: 'ACTIVE' },
      create: {
        name: 'Field Tech Alice',
        email: 'phase6_worker1@civicfix.org',
        password: passwordHash,
        phone: '+1-555-ROAD-01',
        role: 'WORKER',
        department: 'Roads & Potholes',
        status: 'ACTIVE',
      },
    });

    const worker2 = await prisma.user.upsert({
      where: { email: 'phase6_worker2@civicfix.org' },
      update: { role: 'WORKER', department: 'Sanitation & Waste', status: 'ACTIVE' },
      create: {
        name: 'Field Tech Bob',
        email: 'phase6_worker2@civicfix.org',
        password: passwordHash,
        phone: '+1-555-WASTE-02',
        role: 'WORKER',
        department: 'Sanitation & Waste',
        status: 'ACTIVE',
      },
    });

    // Seed WorkerProfile for Worker 1
    await prisma.workerProfile.upsert({
      where: { userId: worker1.id },
      update: { department: 'Roads & Potholes', isAvailable: true },
      create: {
        userId: worker1.id,
        department: 'Roads & Potholes',
        skills: ['asphalt_patching', 'surface_leveling', 'heavy_machinery'],
        vehicleNumber: 'RD-TRUCK-104',
        currentZone: 'Zone 4 North',
        isAvailable: true,
      },
    });

    // Generate JWT tokens
    const citizenToken = generateToken({ id: citizenUser.id, email: citizenUser.email, role: citizenUser.role });
    const authorityToken = generateToken({ id: authorityUser.id, email: authorityUser.email, role: authorityUser.role });
    const worker1Token = generateToken({ id: worker1.id, email: worker1.email, role: worker1.role });
    const worker2Token = generateToken({ id: worker2.id, email: worker2.email, role: worker2.role });

    console.log('✓ Test users and worker profile ready.\n');

    // 2. Test RBAC Protection on /api/worker endpoints
    console.log('[TEST 1] RBAC Authorization Enforcement');
    const resNoAuth = await makeRequest('GET', '/api/worker/complaints');
    if (resNoAuth.status === 401) {
      console.log('  ✓ 401 Unauthorized when unauthenticated');
    } else {
      throw new Error(`Expected 401, got ${resNoAuth.status}`);
    }

    const resCitizen = await makeRequest('GET', '/api/worker/complaints', null, citizenToken);
    if (resCitizen.status === 403) {
      console.log('  ✓ 403 Forbidden when CITIZEN accesses /api/worker/complaints');
    } else {
      throw new Error(`Expected 403, got ${resCitizen.status}`);
    }

    const resAuth = await makeRequest('GET', '/api/worker/complaints', null, authorityToken);
    if (resAuth.status === 403) {
      console.log('  ✓ 403 Forbidden when AUTHORITY accesses /api/worker/complaints');
    } else {
      throw new Error(`Expected 403, got ${resAuth.status}`);
    }

    const resWorker = await makeRequest('GET', '/api/worker/complaints', null, worker1Token);
    if (resWorker.status === 200) {
      console.log('  ✓ 200 OK when WORKER accesses /api/worker/complaints');
    } else {
      throw new Error(`Expected 200, got ${resWorker.status}`);
    }

    // 3. Citizen Reports Complaint & Authority Dispatches Worker 1
    console.log('\n[TEST 2] Complaint Creation & Authority Assignment');
    const createRes = await makeRequest(
      'POST',
      '/api/complaints',
      {
        title: 'Deep Asphalt Crater on Main Blvd',
        description: 'Substantial crater across southbound lane causing road hazards.',
        category: 'ROADS_POTHOLES',
        priority: 'HIGH',
        location: '700 Main Boulevard',
        latitude: 37.779,
        longitude: -122.42,
      },
      citizenToken
    );
    if (createRes.status !== 201) throw new Error('Failed to create complaint');
    const complaint = createRes.data.data;
    console.log(`  ✓ Complaint reported with ID: ${complaint.id}`);

    // Authority assigns Worker 1
    const assignRes = await makeRequest(
      'POST',
      `/api/authority/complaints/${complaint.id}/assign-worker`,
      {
        workerId: worker1.id,
        notes: 'Priority repair order: please inspect and patch within 24 hours.',
      },
      authorityToken
    );
    if (assignRes.status !== 200) throw new Error(`Authority assignment failed: ${JSON.stringify(assignRes.data)}`);
    console.log(`  ✓ Authority assigned complaint to Worker 1 (Alice)`);

    // Verify Assignment entity exists in DB
    const dbAssignment = await prisma.assignment.findFirst({
      where: { complaintId: complaint.id, workerId: worker1.id },
    });
    if (!dbAssignment) throw new Error('Assignment record was not created in database!');
    console.log(`  ✓ Assignment record created in database with ID: ${dbAssignment.id}`);
    console.log(`  ✓ Assignment status: ${dbAssignment.status}`);
    console.log(`  ✓ Assignment assignedAt: ${dbAssignment.assignedAt}`);

    // 4. Strict Worker Isolation & Ownership Enforcement
    console.log('\n[TEST 3] Strict Worker Ownership & Isolation');
    // Worker 2 queue should NOT contain the task
    const worker2Queue = await makeRequest('GET', '/api/worker/complaints', null, worker2Token);
    const inWorker2Queue = worker2Queue.data.data.complaints.some((c) => c.id === complaint.id);
    if (!inWorker2Queue) {
      console.log('  ✓ Worker 2 CANNOT see Worker 1 task in queue');
    } else {
      throw new Error('Worker 2 was able to view Worker 1 task in queue!');
    }

    // Worker 2 direct access attempt
    const worker2Access = await makeRequest('GET', `/api/worker/complaints/${complaint.id}`, null, worker2Token);
    if (worker2Access.status === 403) {
      console.log('  ✓ 403 Forbidden: Worker 2 rejected from viewing Worker 1 task details');
    } else {
      throw new Error(`Expected 403, got ${worker2Access.status}`);
    }

    // Worker 2 mutation attempt
    const worker2Mutation = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaint.id}/status`,
      { status: 'ACCEPTED' },
      worker2Token
    );
    if (worker2Mutation.status === 403) {
      console.log('  ✓ 403 Forbidden: Worker 2 rejected from modifying Worker 1 task');
    } else {
      throw new Error(`Expected 403, got ${worker2Mutation.status}`);
    }

    // Worker 1 can view details
    const worker1Details = await makeRequest('GET', `/api/worker/complaints/${complaint.id}`, null, worker1Token);
    if (worker1Details.status === 200) {
      console.log('  ✓ Worker 1 successfully loaded task details');
    } else {
      throw new Error(`Worker 1 failed to view task: ${JSON.stringify(worker1Details.data)}`);
    }

    // 5. Workflow Step 1: Worker 1 Accepts Task
    console.log('\n[TEST 4] Worker Step 1: Accept Assigned Task');
    const acceptRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaint.id}/status`,
      { status: 'ACCEPTED', notes: 'Alice acknowledged task assignment.' },
      worker1Token
    );
    if (acceptRes.status === 200) {
      const acceptedData = acceptRes.data.data;
      console.log(`  ✓ Task accepted! taskStatus: ${acceptedData.taskStatus}`);
      console.log(`  ✓ acceptedAt recorded: ${acceptedData.acceptedAt}`);
      if (acceptedData.taskStatus !== 'ACCEPTED') throw new Error('taskStatus is not ACCEPTED');
      if (!acceptedData.acceptedAt) throw new Error('acceptedAt timestamp is missing');
    } else {
      throw new Error(`Accept task failed: ${JSON.stringify(acceptRes.data)}`);
    }

    // Verify DB Assignment status
    const acceptedAssignment = await prisma.assignment.findUnique({ where: { id: dbAssignment.id } });
    if (acceptedAssignment.status !== 'ACCEPTED' || !acceptedAssignment.acceptedAt) {
      throw new Error('Database Assignment record was not transitioned to ACCEPTED with acceptedAt');
    }
    console.log('  ✓ Database Assignment status transitioned to ACCEPTED');

    // 6. Workflow Step 2: Worker 1 Starts Work (IN_PROGRESS)
    console.log('\n[TEST 5] Worker Step 2: Start Field Repair (IN_PROGRESS)');
    const startRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaint.id}/status`,
      {
        status: 'IN_PROGRESS',
        notes: 'Arrived on Main Blvd with crew. Cones placed, pavement excavation started.',
      },
      worker1Token
    );
    if (startRes.status === 200) {
      const inProgData = startRes.data.data;
      console.log(`  ✓ Status updated to: ${inProgData.status}`);
      console.log(`  ✓ startedAt recorded: ${inProgData.startedAt}`);
      if (inProgData.status !== 'IN_PROGRESS') throw new Error('Status is not IN_PROGRESS');
      if (!inProgData.startedAt) throw new Error('startedAt timestamp is missing');
    } else {
      throw new Error(`Start work failed: ${JSON.stringify(startRes.data)}`);
    }

    // Verify DB Assignment status
    const inProgAssignment = await prisma.assignment.findUnique({ where: { id: dbAssignment.id } });
    if (inProgAssignment.status !== 'IN_PROGRESS' || !inProgAssignment.startedAt) {
      throw new Error('Database Assignment record was not transitioned to IN_PROGRESS with startedAt');
    }
    console.log('  ✓ Database Assignment status transitioned to IN_PROGRESS');

    // 7. Workflow Step 3: Worker 1 Logs Work Progress Update & Materials
    console.log('\n[TEST 6] Worker Step 3: Log Progress & Materials Consumed');
    const updateRes = await makeRequest(
      'POST',
      `/api/worker/complaints/${complaint.id}/update`,
      {
        notes: 'Cleaned loose gravel, applied heated tack emulsion binder across 4 sq meters.',
        materialsUsed: '15L Hot tack emulsion primer',
      },
      worker1Token
    );
    if (updateRes.status === 201) {
      const updateData = updateRes.data.data;
      console.log(`  ✓ Work update record created with ID: ${updateData.update?.id}`);
      console.log(`  ✓ Materials consumed updated: ${updateData.complaint?.materialsUsed}`);
      if (updateData.update?.updateType !== 'PROGRESS') throw new Error('Expected updateType PROGRESS');
    } else {
      throw new Error(`Progress update failed: ${JSON.stringify(updateRes.data)}`);
    }

    // 8. Workflow Step 4: Worker 1 Uploads Resolution Photographic Proof
    console.log('\n[TEST 7] Worker Step 4: Upload Resolution Evidence Photo');
    const boundary = '----WebKitFormBoundaryWorkerTest' + Date.now();
    const multipartBody = buildMultipartFormData(
      boundary,
      { notes: 'Completed patch compaction and leveling check.' },
      [{ fieldname: 'image', filename: 'pothole_repaired.jpg', contentType: 'image/jpeg', buffer: SAMPLE_JPEG_BUFFER }]
    );

    const uploadRes = await makeRequest(
      'POST',
      `/api/worker/complaints/${complaint.id}/evidence`,
      multipartBody,
      worker1Token,
      `multipart/form-data; boundary=${boundary}`
    );
    if (uploadRes.status === 201) {
      const evidenceData = uploadRes.data.data;
      console.log(`  ✓ Evidence upload succeeded! Photo URL: ${evidenceData.photo?.url}`);
      console.log(`  ✓ Total resolution photos on complaint: ${evidenceData.complaint?.photos?.length}`);
      if (!evidenceData.photo?.url) throw new Error('Uploaded photo URL is missing');
    } else {
      throw new Error(`Evidence upload failed: ${JSON.stringify(uploadRes.data)}`);
    }

    // 9. Workflow Step 5: Worker 1 Submits Completion (RESOLVED)
    console.log('\n[TEST 8] Worker Step 5: Submit Task Completion (RESOLVED)');
    // A: Test missing resolution notes rejection
    const emptyNotesRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaint.id}/status`,
      { status: 'RESOLVED', notes: '' },
      worker1Token
    );
    if (emptyNotesRes.status === 400) {
      console.log('  ✓ 400 Bad Request: Rejected completion when resolution notes are empty');
    } else {
      throw new Error(`Expected 400 for empty resolution notes, got ${emptyNotesRes.status}`);
    }

    // B: Valid resolution submission
    const completeRes = await makeRequest(
      'PATCH',
      `/api/worker/complaints/${complaint.id}/status`,
      {
        status: 'RESOLVED',
        notes: 'Pavement restored with high-density hot asphalt mix. Roller compacted flush with roadway. Traffic restored.',
        materialsUsed: '300kg Dense hot asphalt, 15L tack primer',
      },
      worker1Token
    );
    if (completeRes.status === 200) {
      const resolvedData = completeRes.data.data;
      console.log(`  ✓ Complaint status updated to: ${resolvedData.status}`);
      console.log(`  ✓ taskStatus updated to: ${resolvedData.taskStatus}`);
      console.log(`  ✓ resolvedAt recorded: ${resolvedData.resolvedAt}`);
      console.log(`  ✓ resolutionNotes stored: "${resolvedData.resolutionNotes?.substring(0, 50)}..."`);
      if (resolvedData.status !== 'RESOLVED') throw new Error('Expected status RESOLVED');
      if (resolvedData.taskStatus !== 'COMPLETED') throw new Error('Expected taskStatus COMPLETED');
    } else {
      throw new Error(`Complete task failed: ${JSON.stringify(completeRes.data)}`);
    }

    // Verify DB Assignment completedAt
    const completedAssignment = await prisma.assignment.findUnique({ where: { id: dbAssignment.id } });
    if (completedAssignment.status !== 'COMPLETED' || !completedAssignment.completedAt) {
      throw new Error('Database Assignment record was not marked COMPLETED with completedAt');
    }
    console.log('  ✓ Database Assignment status transitioned to COMPLETED with completedAt');

    // 10. Final Verification: Check Complete Lifecycle, Timeline & Security
    console.log('\n[TEST 9] Complete Task Lifecycle & Security Verification');
    const finalDetails = await makeRequest('GET', `/api/worker/complaints/${complaint.id}`, null, worker1Token);
    if (finalDetails.status === 200) {
      const task = finalDetails.data.data;
      console.log(`  ✓ Final complaint retrieved: ${task.title}`);
      console.log(`  ✓ Total assignments: ${task.assignments?.length}`);
      console.log(`  ✓ Total work updates: ${task.workUpdates?.length}`);
      console.log(`  ✓ Total timeline events: ${task.timeline?.length}`);

      console.log('\n  Workflow Milestones:');
      console.log(`   - Assigned At:  ${task.assignments?.[0]?.assignedAt}`);
      console.log(`   - Accepted At:  ${task.acceptedAt}`);
      console.log(`   - Started At:   ${task.startedAt}`);
      console.log(`   - Resolved At:  ${task.resolvedAt}`);
      console.log(`   - Completed At: ${task.assignments?.[0]?.completedAt}`);

      // Security check: No password hashes exposed
      const checkJson = JSON.stringify(task);
      if (checkJson.includes(passwordHash) || checkJson.includes('"password":')) {
        throw new Error('SECURITY VIOLATION: Password hash detected in worker API response!');
      }
      console.log('  ✓ PASS: Zero password leaks in response');
    } else {
      throw new Error(`Failed to retrieve final task: ${JSON.stringify(finalDetails.data)}`);
    }

    console.log('\n🎉 ALL PHASE 6 WORKER SYSTEM VERIFICATION TESTS PASSED! 🎉');
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

