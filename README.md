# Hall Pass Pro

A school hall pass management system with three user roles: Admin, Teacher, and Student.

## Features

- Students can request hall passes specifying departure room, destination, and notes.
- Teachers can approve or deny requests and confirm student returns.
- Admins have full access to all passes and can manage settings.
- Timer tracks the duration of approved passes.

## Setup

1. Install dependencies: `npm install`
2. Set up a PostgreSQL database (e.g., using Supabase for a free tier).
3. Update `.env.local` with your `DATABASE_URL`.
4. Run database migrations: `npx prisma db push`
5. Run the development server: `npm run dev`

## Usage

- Access the application at http://localhost:3000
- Log in with appropriate credentials based on role.

## Technologies

- Next.js
- PostgreSQL (via Prisma)
- NextAuth.js
- Tailwind CSS