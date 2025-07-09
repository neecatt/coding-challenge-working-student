import prisma from './prisma.js';

async function seedDatabase() {
  console.log('🌱 Seeding database with Prisma raw SQL...');

  try {
    // Insert organisations
    await prisma.$executeRaw`
      INSERT INTO organisation (id, name) VALUES 
        (1, 'Acme Corp'),
        (2, 'Globex Inc')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
    console.log('✅ Organisations seeded');

    // Insert users
    await prisma.$executeRaw`
      INSERT INTO users (id, name, organisation_id) VALUES 
        (1, 'Alice', 1),
        (2, 'Bob', 1),
        (3, 'Carol', 2)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        organisation_id = EXCLUDED.organisation_id
    `;
    console.log('✅ Users seeded');

    // Insert tickets
    await prisma.$executeRaw`
      INSERT INTO tickets (id, title, description, status, user_id, organisation_id) VALUES 
        (1, 'Broken printer', 'The 3rd floor printer is jammed.', 'open', 1, 1),
        (2, 'VPN not connecting', 'Cannot connect since morning.', 'open', 2, 1),
        (3, 'Website down', 'Landing page returns 500.', 'open', 3, 2),
        (4, 'Request new laptop', 'Need a MacBook Pro M3.', 'pending', 1, 1),
        (5, 'Email spam issue', 'Receiving lots of spam emails.', 'open', 2, 1)
      ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        user_id = EXCLUDED.user_id,
        organisation_id = EXCLUDED.organisation_id
    `;
    console.log('✅ Tickets seeded');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(async () => {
    console.log('✅ Seed completed');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }); 