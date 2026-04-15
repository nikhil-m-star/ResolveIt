import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  // Create a President user
  const president = await prisma.user.upsert({
    where: { email: 'president@resolveit.com' },
    update: {},
    create: {
      clerkId: 'seed_president_1',
      name: 'Admin President',
      email: 'president@resolveit.com',
      role: 'PRESIDENT',
      city: 'Bengaluru',
      tier: 'PLATINUM',
    },
  });

  // Create an Officer user
  const officer = await prisma.user.upsert({
    where: { email: 'officer@resolveit.com' },
    update: {},
    create: {
      clerkId: 'seed_officer_1',
      name: 'Field Officer Raj',
      email: 'officer@resolveit.com',
      role: 'OFFICER',
      city: 'Bengaluru',
      area: 'Koramangala',
      tier: 'GOLD',
      resolvedCount: 45,
      avgRating: 4.8,
    },
  });

  // Create a Citizen user
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@resolveit.com' },
    update: {},
    create: {
      clerkId: 'seed_citizen_1',
      name: 'Rahul Sharma',
      email: 'citizen@resolveit.com',
      role: 'CITIZEN',
      city: 'Bengaluru',
      area: 'Koramangala',
      points: 120,
      tier: 'SILVER',
    },
  });

  // Create a dummy issue
  const issue = await prisma.issue.create({
    data: {
      title: 'Massive Pothole on 80ft Road',
      description: 'A massive pothole has formed after the recent rains, causing a huge risk to two-wheelers.',
      category: 'POTHOLE',
      status: 'REPORTED',
      city: 'Bengaluru',
      area: 'Koramangala',
      latitude: 12.9352,
      longitude: 77.6245,
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      intensity: 8,
      etaDays: 3,
      createdById: citizen.id,
      votes: 1,
    },
  });

  console.log('Database seeding completed successfully ✅');
  console.log(`Created test users: ${president.email}, ${officer.email}, ${citizen.email}`);
  console.log(`Created test issue: ${issue.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });