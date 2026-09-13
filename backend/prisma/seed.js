const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

async function seed() {
  console.log('===================================================');
  console.log('  CIVICFIX DATABASE CLEAN PURGE & SEED INITIALIZATION');
  console.log('===================================================');

  // 1. Purge all existing data in child -> parent order
  console.log('1. Clearing work updates...');
  await prisma.workUpdate.deleteMany({});

  console.log('2. Clearing assignments...');
  await prisma.assignment.deleteMany({});

  console.log('3. Clearing complaint histories...');
  await prisma.complaintHistory.deleteMany({});

  console.log('4. Clearing notifications...');
  await prisma.notification.deleteMany({});

  console.log('5. Clearing audit logs...');
  await prisma.auditLog.deleteMany({});

  console.log('6. Clearing complaints...');
  await prisma.complaint.deleteMany({});

  console.log('7. Clearing worker profiles...');
  await prisma.workerProfile.deleteMany({});

  console.log('8. Clearing all users...');
  await prisma.user.deleteMany({});

  console.log('✓ All dummy complaints, workers, authorities, and legacy users removed.');

  // 2. Hash password for admin
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'adminkimkc';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 3. Create single Admin user
  console.log('Creating Admin account...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      phone: '+91 99999 99999',
      role: 'ADMIN',
      status: 'ACTIVE',
      department: 'City Municipal Administration',
      designation: 'Super Administrator',
    },
  });

  console.log('---------------------------------------------------');
  console.log('✅ Admin Account Initialized Successfully:');
  console.log(`   - Name:     ${adminUser.name}`);
  console.log(`   - Email:    ${adminUser.email}`);
  console.log(`   - Role:     ${adminUser.role}`);
  console.log(`   - Status:   ${adminUser.status}`);
  console.log(`   - Password: ${adminPassword}`);
  console.log('---------------------------------------------------');

  // 4. Verify clean counts
  const userCount = await prisma.user.count();
  const complaintCount = await prisma.complaint.count();
  const workerProfileCount = await prisma.workerProfile.count();
  const notifCount = await prisma.notification.count();
  const auditCount = await prisma.auditLog.count();

  console.log('Database Status Verification:');
  console.log(`   - Users:          ${userCount} (Admin only)`);
  console.log(`   - Complaints:     ${complaintCount}`);
  console.log(`   - WorkerProfiles: ${workerProfileCount}`);
  console.log(`   - Notifications:  ${notifCount}`);
  console.log(`   - Audit Logs:     ${auditCount}`);
  console.log('===================================================');
  console.log('Database reset complete. Ready for custom department authority creation!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
