# BiteSpeed-Backend-Task
BiteSpeed Backend Task Submission by Aeshna Jain

A Node.js service built with Express.js and Prisma ORM that identifies and tracks customer identity across multiple purchases by linking contacts based on shared email addresses or phone numbers.

## Features

- **Smart Contact Linking**: Automatically links contacts sharing email or phone numbers
- **Primary Contact Resolution**: Converts contacts to maintain single primary contact per customer
- **Consolidated Response**: Returns unified customer contact information
- **Data Integrity**: Maintains referential integrity with proper database relations
- **Performance Optimized**: Uses database indexes and efficient queries

## Tech Stack

- **Backend**: Node.js, Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Environment**: dotenv for configuration

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### 1. Clone and Install
\`\`\`bash
mkdir bitespeed-identity-service
cd bitespeed-identity-service

# Copy all the files from the artifact above
# Then install dependencies:
npm install
\`\`\`

### 2. Environment Setup
Create a \`.env\` file with your database credentials:
\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed?schema=public"
PORT=3000
NODE_ENV=development
\`\`\`

### 3. Database Setup
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# OR create and run migrations (for production)
npm run db:migrate

# Optional: Seed database with sample data
npm run db:seed

# Optional: Open Prisma Studio to view data
npm run db:studio
\`\`\`

### 4. Run the Service
\`\`\`bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
\`\`\`

## API Documentation

### POST /identify
Identifies and consolidates customer contact information.

**Request Body:**
\`\`\`json
{
  "email": "customer@example.com",    // optional
  "phoneNumber": "1234567890"         // optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890", "0987654321"],
    "secondaryContactIds": [2, 3]
  }
}
\`\`\`

### GET /health
Health check endpoint that returns service status.

## Project Structure
\`\`\`
src/
├── controllers/        # Request handlers
├── services/          # Business logic
├── routes/            # Route definitions
├── db.js             # Database configuration
└── server.js         # Express app setup
prisma/
├── schema.prisma     # Database schema
└── seed.js          # Sample data
\`\`\`

## Key Business Logic

1. **New Contact**: Creates primary contact when no existing contacts found
2. **Existing Match**: Returns consolidated info for exact matches
3. **Partial Match**: Creates secondary contact when new information provided
4. **Contact Merging**: Converts separate primary contacts to linked structure
5. **Network Discovery**: Uses recursive queries to find all linked contacts

## Example Usage

\`\`\`bash
# Create new contact
curl -X POST http://localhost:3000/identify \\
  -H "Content-Type: application/json" \\
  -d '{"email": "john@example.com", "phoneNumber": "123456"}'

# Link contacts (if phone matches existing contact)
curl -X POST http://localhost:3000/identify \\
  -H "Content-Type: application/json" \\
  -d '{"email": "john.doe@example.com", "phoneNumber": "123456"}'
\`\`\`

## Development Commands

- \`npm run dev\` - Start development server
- \`npm run db:studio\` - Open database GUI
- \`npm run db:generate\` - Generate Prisma client
- \`npm run db:push\` - Push schema changes
- \`npm run db:seed\` - Seed sample data
