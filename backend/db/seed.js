import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Seeding database with authentication data...');

  try {
    // Hash passwords for users
    const saltRounds = 12;
    const password = 'SecurePass123!';
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert organisations
    await prisma.$executeRaw`
      INSERT INTO organisation (id, name) VALUES 
        (1, 'Acme Corp'),
        (2, 'Globex Inc'),
        (3, 'Tech Solutions Ltd')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;
    console.log('✅ Organisations seeded');

    // Insert users with authentication data (let database auto-generate IDs)
    await prisma.$executeRaw`
      INSERT INTO users (
        name, 
        email, 
        password, 
        role, 
        last_login_at,
        organisation_id,
        created_at,
        updated_at
      ) VALUES 
        ('Alice Johnson', 'alice@acme.com', ${hashedPassword}, 'ADMIN', NOW(), 1, NOW(), NOW()),
        ('Bob Smith', 'bob@acme.com', ${hashedPassword}, 'USER', NOW(), 1, NOW(), NOW()),
        ('Carol Davis', 'carol@globex.com', ${hashedPassword}, 'MANAGER', NOW(), 2, NOW(), NOW()),
        ('David Wilson', 'david@techsolutions.com', ${hashedPassword}, 'USER', NOW(), 3, NOW(), NOW()),
        ('Eve Brown', 'eve@acme.com', ${hashedPassword}, 'USER', NOW(), 1, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        last_login_at = EXCLUDED.last_login_at,
        organisation_id = EXCLUDED.organisation_id,
        updated_at = NOW()
    `;
    console.log('✅ Users seeded with authentication data');

    // Insert tickets (let database auto-generate IDs)
    await prisma.$executeRaw`
      INSERT INTO tickets (title, description, status, user_id, organisation_id, created_at) VALUES 
        ('Broken printer', 'The 3rd floor printer is jammed and needs immediate attention.', 'open', 1, 1, NOW()),
        ('VPN not connecting', 'Cannot connect to VPN since morning. Getting timeout errors.', 'open', 2, 1, NOW()),
        ('Website down', 'Landing page returns 500 error. Customers cannot access the site.', 'open', 3, 2, NOW()),
        ('Request new laptop', 'Need a MacBook Pro M3 for development work.', 'pending', 1, 1, NOW()),
        ('Email spam issue', 'Receiving lots of spam emails. Need better filtering.', 'open', 2, 1, NOW()),
        ('Software license renewal', 'Adobe Creative Suite license expires next month.', 'open', 3, 2, NOW()),
        ('Network connectivity', 'WiFi signal is weak in conference room B.', 'open', 4, 3, NOW()),
        ('Password reset', 'Need to reset password for new employee onboarding.', 'closed', 5, 1, NOW())
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Tickets seeded');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Email: alice@acme.com | Password: SecurePass123! | Role: ADMIN');
    console.log('Email: bob@acme.com | Password: SecurePass123! | Role: USER');
    console.log('Email: carol@globex.com | Password: SecurePass123! | Role: MANAGER');
    console.log('Email: david@techsolutions.com | Password: SecurePass123! | Role: USER');
    console.log('Email: eve@acme.com | Password: SecurePass123! | Role: USER');
    console.log('\n🔗 Test the API with:');
    console.log('POST http://localhost:4000/api/auth/login');
    console.log('GET http://localhost:4000/api/tickets (with Authorization header)');

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