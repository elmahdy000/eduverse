import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const FIXED_OWNERS = [
  { fullName: 'Mahmoud Elmahdy', phoneNumber: '01000000001', customerType: 'owner_discount' },
  { fullName: 'Khaled Salah', phoneNumber: '01000000002', customerType: 'owner_discount' },
  { fullName: 'Mahmoud Ezz', phoneNumber: '01000000003', customerType: 'owner_discount' },
  { fullName: 'Mohamed Abdelazim', phoneNumber: '01000000005', customerType: 'owner_discount' },
  { fullName: 'Nada Elbaz', phoneNumber: '01000000006', customerType: 'owner_discount' },
  { fullName: 'Mahmoud Abd Rabou', phoneNumber: '01000000004', customerType: 'owner_discount' },
  { fullName: 'Eng. Mohamed', phoneNumber: '01000000007', customerType: 'owner_discount' },
];

async function main() {
  console.log('👑 Seeding/Upserting Fixed Owners for 70% Bar Discount...');

  const ownerUser = await prisma.user.findFirst({
    where: { role: { name: 'Owner' } },
  });

  const createdById = ownerUser?.id || undefined;

  for (const owner of FIXED_OWNERS) {
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { phoneNumber: owner.phoneNumber },
          { fullName: { equals: owner.fullName, mode: 'insensitive' } }
        ]
      }
    });

    if (!existing) {
      const created = await prisma.customer.create({
        data: {
          fullName: owner.fullName,
          phoneNumber: owner.phoneNumber,
          customerType: 'owner_discount',
          notes: 'مالك مكان - خصم 50% للحجوزات و 70% للبار',
          createdByUserId: createdById,
        }
      });
      console.log(` Created owner customer: ${created.fullName} (${created.id})`);
    } else {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          fullName: owner.fullName,
          phoneNumber: owner.phoneNumber,
          customerType: 'owner_discount',
          notes: 'مالك مكان - خصم 50% للحجوزات و 70% للبار'
        }
      });
      console.log(` Updated owner customer: ${updated.fullName} -> owner_discount`);
    }
  }

  console.log(' All 7 fixed owners synced successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
