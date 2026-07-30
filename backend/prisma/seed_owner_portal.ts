/**
 * Seed مخصّص لبوابة أصحاب المشروع (Owner Portal).
 * -----------------------------------------------------------------------------
 * - ينشئ role باسم 'OwnerPortal' (منفصل تماماً عن Owner العادي)
 * - ينشئ حسابين افتراضيين للـ owners للدخول على البوابة
 * - يمكن تشغيله بأمان أكثر من مرة (idempotent) — لن يكرّر الإنشاء
 *
 * التشغيل:
 *   npx ts-node prisma/seed_owner_portal.ts
 * أو من الحقيقي:
 *   npx prisma db seed  (بعد تسجيله في package.json)
 *
 * ملاحظات أمان:
 * - غيّر كلمات المرور الافتراضية فور تشغيل البوابة على الإنتاج.
 * - هذا الـ role لا يملك أي permissions عادية؛ الوصول مقيّد بـ OwnerPortalGuard.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_OWNERS = [
  {
    email: 'owner-portal@eduvers.com',
    firstName: 'Owner',
    lastName: 'Portal',
  },
  {
    email: 'elmahdy-portal@eduvers.com',
    firstName: 'Elmahdy',
    lastName: 'Portal',
  },
];

async function main() {
  console.log('🌱 [OwnerPortal Seed] Starting...');

  const seedPassword = process.env.OWNER_PORTAL_SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('OWNER_PORTAL_SEED_PASSWORD must be set to at least 12 characters before seeding');
  }

  // 1) إنشاء أو جلب الـ role
  let role = await prisma.role.findUnique({ where: { name: 'OwnerPortal' } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'OwnerPortal',
        description:
          'حسابات دخول بوابة أصحاب المشروع (تقارير قراءة فقط). معزولة عن Owner العادي.',
      },
    });
    console.log('✅ [OwnerPortal Seed] Role created:', role.id);
  } else {
    console.log('ℹ️  [OwnerPortal Seed] Role already exists:', role.id);
  }

  // 2) إنشاء المستخدمين الافتراضيين (إن لم يكونوا موجودين)
  for (const u of DEFAULT_OWNERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // تحديث الـ role فقط في حال تغيّر
      if (existing.roleId !== role.id) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { roleId: role.id, status: 'active' },
        });
        console.log(`🔧 [OwnerPortal Seed] Updated role for existing user: ${u.email}`);
      } else {
        console.log(`ℹ️  [OwnerPortal Seed] User already exists: ${u.email}`);
      }
      continue;
    }

    const passwordHash = await bcrypt.hash(seedPassword, 10);
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: role.id,
        status: 'active',
      },
    });
    console.log(`✅ [OwnerPortal Seed] Created user: ${u.email}`);
  }

  console.log('\n🎉 [OwnerPortal Seed] Done.');
  console.log('👤 Created/verified logins:');
  for (const u of DEFAULT_OWNERS) {
    console.log(`   - ${u.email}`);
  }
  console.log('\n✅ Passwords were read from OWNER_PORTAL_SEED_PASSWORD and were not printed.');
}

main()
  .catch((e) => {
    console.error('❌ [OwnerPortal Seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
