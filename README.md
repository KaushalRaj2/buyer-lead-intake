# Buyer Lead Intake System

A professional buyer lead management system built with Next.js and TypeScript.

## Features

- 🔐 User authentication (Admin/User roles)
- 👥 User management system
- 📋 Lead tracking and management
- 📊 Import/Export functionality
- 📈 Analytics dashboard
- 🎯 Role-based permissions

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Custom JWT-based auth
- **Deployment:** Vercel (Frontend & Backend)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Run the development server: `npm run dev`
5. Open http://localhost:3000

## Environment Variables

Create a `.env.local` file:

DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret

text

## Demo Accounts

- **Admin:** admin@example.com / admin123
- **User:** demo@example.com / demo123

## License

MIT License