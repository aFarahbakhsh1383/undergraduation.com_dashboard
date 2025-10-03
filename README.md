# Undergraduation Admin Dashboard

This is a lightweight CRM dashboard built with Next.js, Firebase (Auth + Firestore), and Tailwind.

## Setup
1. Create a Firebase project and enable Firestore and Authentication.
2. Place your client SDK settings in `src/lib/firebase.ts`.
3. For local demo, seed data:
   - `bun run seed` (basic seed)
   - `bun run seed:more` (100 students & 100 colleges)
4. Start dev server: `bun run dev`

## Authentication
- For demo/login, manually add a user in Firebase Authentication (Email/Password):
  - Firebase Console → Authentication → Users → Add User
  - Use those credentials on `/login` to access the dashboard.

## ADRs (Architecture Decision Records)
- docs/adr-001-stack.md
  - Records the tech stack decision: Next.js (App Router) + Tailwind + shadcn/ui on the frontend, Firebase (Firestore + Auth) for data/auth, and why this is a good fit for a fast admin MVP. Includes alternatives and trade-offs.
- docs/adr-002-data-model.md
  - Describes the Firestore data model: `students` root collection with subcollections (`colleges`, `essays`, `activities`, `interactions`, `communications`, `notes`). Explains why subcollections are used, key fields, query patterns, and scalability considerations.
- docs/adr-003-server-side-filtering.md
  - Explains server-side filtering/pagination: `/api/students` and `/api/colleges` endpoints, supported query params, and how the dashboard uses a separate summary endpoint for colleges to power stats and histograms independent of table pagination.

## Notes
- The dashboard uses server-side filtering for Students and Colleges.
- The Colleges summary cards and histogram reflect the full filtered dataset, independent of the table pagination.

## Made by: Ali Farahbakhsh
- Email: afarahbakhsh@ucsd.edu
- Website: [ali-dev.webflow.io](https://ali-dev.webflow.io/)
- Linkedin: [linkedin.com/in/ali-farahbakhsh](https://www.linkedin.com/in/ali-farahbakhsh/)