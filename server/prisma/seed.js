import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database...');

  const CITY = 'Bengaluru';

  // Reset database for a clean, idempotent run.
  await prisma.$transaction([
    prisma.vote.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.statusHistory.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.rating.deleteMany({}),
    prisma.issue.deleteMany({}),
  ]);

  // Clear notification/vote residue from seeded users if they exist.
  const seededUsers = await prisma.user.findMany({
    where: { clerkId: { startsWith: 'seed_' } },
    select: { id: true },
  });
  const seededUserIds = seededUsers.map((u) => u.id);
  if (seededUserIds.length > 0) {
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: { in: seededUserIds } } }),
      prisma.vote.deleteMany({ where: { userId: { in: seededUserIds } } }),
    ]);
  }

  // Create or refresh users.
  const president = await prisma.user.upsert({
    where: { email: 'president@resolveit.com' },
    update: {
      name: 'Admin President',
      role: 'PRESIDENT',
      city: CITY,
      area: 'HQ',
      resolvedCount: 130,
      assignedCount: 75,
      avgRating: 4.9,
    },
    create: {
      clerkId: 'seed_president_1',
      name: 'Admin President',
      email: 'president@resolveit.com',
      role: 'PRESIDENT',
      city: CITY,
      area: 'HQ',
      resolvedCount: 130,
      assignedCount: 75,
      avgRating: 4.9,
    },
  });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@resolveit.com' },
    update: {
      name: 'Field Officer Raj',
      role: 'OFFICER',
      city: CITY,
      area: 'Koramangala',
      resolvedCount: 46,
      assignedCount: 22,
      avgRating: 4.7,
    },
    create: {
      clerkId: 'seed_officer_1',
      name: 'Field Officer Raj',
      email: 'officer@resolveit.com',
      role: 'OFFICER',
      city: CITY,
      area: 'Koramangala',
      resolvedCount: 46,
      assignedCount: 22,
      avgRating: 4.7,
    },
  });

  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@resolveit.com' },
    update: {
      name: 'Rahul Sharma',
      role: 'CITIZEN',
      city: CITY,
      area: 'Koramangala',
    },
    create: {
      clerkId: 'seed_citizen_1',
      name: 'Rahul Sharma',
      email: 'citizen@resolveit.com',
      role: 'CITIZEN',
      city: CITY,
      area: 'Koramangala',
    },
  });

  const citizenTwo = await prisma.user.upsert({
    where: { email: 'citizen2@resolveit.com' },
    update: {
      name: 'Neha R',
      role: 'CITIZEN',
      city: CITY,
      area: 'Indiranagar',
    },
    create: {
      clerkId: 'seed_citizen_2',
      name: 'Neha R',
      email: 'citizen2@resolveit.com',
      role: 'CITIZEN',
      city: CITY,
      area: 'Indiranagar',
    },
  });

  // Create multiple issues for feed, heatmap, admin, kanban and detail views.
  const createdIssues = [];
  const issueSpecs = [
    {
      title: 'SEED - Deep pothole outside Sony Signal flyover turn',
      description: 'A deep pothole has opened up near the left-turn lane and riders are swerving abruptly in peak traffic.',
      category: 'POTHOLE',
      status: 'REPORTED',
      city: CITY,
      area: 'Koramangala',
      latitude: 12.9352,
      longitude: 77.6245,
      intensity: 8,
      etaDays: 3,
      votes: 21,
      createdById: citizen.id,
      imageUrls: [
        '/seeds/pothole.png'
      ],
    },
    {
      title: 'SEED - Dark stretch due to failed streetlights near Metro exit',
      description: 'Four streetlights are non-functional near the station exit, reducing pedestrian visibility after 8 PM.',
      category: 'STREETLIGHT',
      status: 'IN_PROGRESS',
      city: CITY,
      area: 'Indiranagar',
      latitude: 12.9784,
      longitude: 77.6408,
      intensity: 6,
      etaDays: 2,
      votes: 14,
      createdById: citizenTwo.id,
      assignedToId: officer.id,
      imageUrls: [
        '/seeds/streetlight.png'
      ],
    },
    {
      title: 'SEED - Overflowing garbage skip beside weekly market',
      description: 'Garbage collection has been missed for multiple days; spillover is blocking shop-front access.',
      category: 'GARBAGE',
      status: 'RESOLVED',
      city: CITY,
      area: 'HSR Layout',
      latitude: 12.9116,
      longitude: 77.6474,
      intensity: 5,
      etaDays: 1,
      votes: 11,
      createdById: citizen.id,
      assignedToId: officer.id,
      resolvedById: officer.id,
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      imageUrls: [
        '/seeds/garbage.png'
      ],
    },
    {
      title: 'SEED - Continuous pipeline leakage causing waterlogging',
      description: 'Water is flowing from the manhole edge all day and creating slippery patches near the signal.',
      category: 'WATER_LEAK',
      status: 'REPORTED',
      city: CITY,
      area: 'BTM Layout',
      latitude: 12.9166,
      longitude: 77.6101,
      intensity: 7,
      etaDays: 4,
      votes: 10,
      createdById: citizenTwo.id,
      imageUrls: [
        '/seeds/water_leak.png'
      ],
    },
    {
      title: 'SEED - Fallen tree branch blocking one carriageway',
      description: 'A large branch collapsed after rain and now blocks one lane, forcing traffic into oncoming flow.',
      category: 'TREE_FALLEN',
      status: 'IN_PROGRESS',
      city: CITY,
      area: 'Jayanagar',
      latitude: 12.9293,
      longitude: 77.5838,
      intensity: 6,
      etaDays: 2,
      votes: 13,
      createdById: citizen.id,
      assignedToId: officer.id,
      imageUrls: [
        '/seeds/tree_fallen.png'
      ],
    },
    {
      title: 'SEED - Open sewage line and foul smell near school wall',
      description: 'Sewage line is partially open and wastewater is overflowing onto the sidewalk used by students.',
      category: 'SEWAGE',
      status: 'REPORTED',
      city: CITY,
      area: 'Banaswadi',
      latitude: 13.0126,
      longitude: 77.6511,
      intensity: 9,
      etaDays: 5,
      votes: 18,
      slaBreached: true,
      createdById: citizenTwo.id,
      imageUrls: [
        '/seeds/sewage.png'
      ],
    },
    {
      title: 'SEED - Frequent power cuts in residential block C',
      description: 'Residents report repeated outages every evening, affecting lifts and common-area safety lights.',
      category: 'POWER_CUT',
      status: 'IN_PROGRESS',
      city: CITY,
      area: 'Whitefield',
      latitude: 12.9698,
      longitude: 77.7499,
      intensity: 7,
      etaDays: 2,
      votes: 16,
      createdById: citizen.id,
      assignedToId: officer.id,
      imageUrls: [
        '/seeds/power_cut.png'
      ],
    },
    {
      title: 'SEED - Bribery attempt reported at permit desk',
      description: 'Citizen reported unofficial cash demand for document processing. Escalated for vigilance review.',
      category: 'BRIBERY',
      status: 'REJECTED',
      city: CITY,
      area: 'Shivajinagar',
      latitude: 12.9868,
      longitude: 77.6039,
      intensity: 8,
      etaDays: 7,
      votes: 9,
      isAnonymous: true,
      createdById: citizenTwo.id,
      imageUrls: [
        '/seeds/bribery.png'
      ],
    },
  ];

  for (const spec of issueSpecs) {
    const issue = await prisma.issue.create({ data: spec });
    createdIssues.push(issue);
  }

  // Add status history and comments for richer detail pages.
  const inProgressIssue = createdIssues.find((i) => i.status === 'IN_PROGRESS');
  if (inProgressIssue) {
    await prisma.statusHistory.create({
      data: {
        issueId: inProgressIssue.id,
        userId: officer.id,
        oldStatus: 'REPORTED',
        newStatus: 'IN_PROGRESS',
        note: 'Crew has been assigned and inspection completed.',
      },
    });
  }

  const resolvedIssue = createdIssues.find((i) => i.status === 'RESOLVED');
  if (resolvedIssue) {
    await prisma.statusHistory.createMany({
      data: [
        {
          issueId: resolvedIssue.id,
          userId: officer.id,
          oldStatus: 'REPORTED',
          newStatus: 'IN_PROGRESS',
          note: 'Collected site evidence and initiated cleanup.',
        },
        {
          issueId: resolvedIssue.id,
          userId: officer.id,
          oldStatus: 'IN_PROGRESS',
          newStatus: 'RESOLVED',
          note: 'Garbage removed and area disinfected.',
        },
      ],
    });
  }

  await prisma.comment.createMany({
    data: [
      {
        issueId: createdIssues[0].id,
        userId: citizenTwo.id,
        comment: 'I almost slipped here this morning. Please prioritize.',
      },
      {
        issueId: createdIssues[1].id,
        userId: officer.id,
        comment: 'Replacement bulbs procured. Team expected to fix tonight.',
      },
      {
        issueId: createdIssues[2].id,
        userId: citizen.id,
        comment: 'Cleanup confirmed. Thanks for the quick response.',
      },
    ],
  });

  // Create some notification samples for UI dropdown.
  await prisma.notification.createMany({
    data: [
      {
        userId: citizen.id,
        issueId: createdIssues[1].id,
        type: 'INFO',
        message: 'Your streetlight issue was moved to IN_PROGRESS.',
      },
      {
        userId: citizen.id,
        issueId: createdIssues[2].id,
        type: 'RESOLVED',
        message: 'Your garbage issue has been resolved.',
      },
      {
        userId: officer.id,
        issueId: createdIssues[0].id,
        type: 'URGENT',
        message: 'New high-intensity pothole issue assigned to you.',
      },
    ],
  });

  // Add explicit votes (issue.votes counter already set for feed visuals).
  await prisma.vote.createMany({
    data: [
      { issueId: createdIssues[0].id, userId: citizenTwo.id },
      { issueId: createdIssues[1].id, userId: citizen.id },
      { issueId: createdIssues[3].id, userId: citizen.id },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeding completed successfully ✅');
  console.log(`Seed users: ${president.email}, ${officer.email}, ${citizen.email}, ${citizenTwo.email}`);
  console.log(`Seed issues created: ${createdIssues.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
