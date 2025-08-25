const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.contact.deleteMany();

  // Create sample data
  const contact1 = await prisma.contact.create({
    data: {
      phoneNumber: '123456',
      email: 'lorraine@hillvalley.edu',
      linkedId: null,
      linkPrecedence: 'primary'
    }
  });

  const contact2 = await prisma.contact.create({
    data: {
      phoneNumber: '123456',
      email: 'mcfly@hillvalley.edu',
      linkedId: contact1.id,
      linkPrecedence: 'secondary'
    }
  });

  const contact3 = await prisma.contact.create({
    data: {
      phoneNumber: '919191',
      email: 'george@hillvalley.edu',
      linkedId: null,
      linkPrecedence: 'primary'
    }
  });

  const contact4 = await prisma.contact.create({
    data: {
      phoneNumber: '717171',
      email: 'biffsucks@hillvalley.edu',
      linkedId: null,
      linkPrecedence: 'primary'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('Sample contacts created:', { contact1, contact2, contact3, contact4 });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// tests/api.test.js (Optional testing file)
// You can use this with Jest for testing
const request = require('supertest');
// const app = require('../src/server');

// Sample test cases (uncomment when setting up testing)
/*
describe('POST /identify', () => {
  test('should create new primary contact when no existing contacts', async () => {
    const response = await request(app)
      .post('/identify')
      .send({
        email: 'test@example.com',
        phoneNumber: '999999'
      });

    expect(response.status).toBe(200);
    expect(response.body.contact).toHaveProperty('primaryContatctId');
    expect(response.body.contact.emails).toContain('test@example.com');
    expect(response.body.contact.phoneNumbers).toContain('999999');
  });

  test('should return existing contact when exact match found', async () => {
    // Add test logic here
  });
});
*/