/**
 * Prisma Seed Script — creates default users for testing
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { name: 'Admin', email: 'admin@example.com', password: 'Admin123!', role: 'ADMIN' },
  { name: 'สมชาย จัด HR', email: 'hr@example.com', password: 'HrPass123!', role: 'HR_MANAGER' },
  { name: 'สมหญิง สัมภาษณ์', email: 'interviewer@example.com', password: 'Interview1!', role: 'INTERVIEWER' },
  { name: 'อรุณ ดูงาน', email: 'viewer@example.com', password: 'Viewer123!', role: 'VIEWER' },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: { name: u.name, email: u.email, password: hashed, role: u.role },
      });
      console.log(`  ✅ Created ${u.role}: ${u.email}`);
    } else {
      console.log(`  ℹ️  Already exists: ${u.email}`);
    }
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
