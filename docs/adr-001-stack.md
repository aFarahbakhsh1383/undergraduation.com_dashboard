# ADR-001: Stack Selection for Undergraduation.com Admin Dashboard

## Status
Accepted

## Context
- The goal is to deliver a functional, demonstrable internal CRM prototype quickly.
- Project requires: Auth, database, simple backend logic, and modern UI.

## Decision
**Stack:**
- **Frontend:** Next.js (React, TypeScript) with shadcn/ui and TailwindCSS
- **Backend/API:** Next.js API Routes (Node.js, TypeScript)
- **Database/Auth:** Firebase (Firestore + Auth)

#### Rationale
- **Next.js:** Enables backend API and frontend in the same codebase. API routes are ideal for small demos and enable rapid iteration. Built-in routing simplifies navigation.
- **shadcn/ui:** Provides beautiful, modern, accessible UI components that fit a dashboard use case. Customizable and saves time vs hand-rolling dashboard UIs.
- **Firebase:** One platform for both Auth and data (Firestore). Great for rapid prototyping, easy setup for demos, and free tier.
- **TypeScript:** Strict typing for fewer bugs and clearer docs.
- **Single Platform:** Using Next.js for BE/FE and Firebase for data/auth minimizes coordination overhead.

#### Alternatives Considered
- **Separate FE (React) + BE (Express, FastAPI, Flask):** Adds overhead for APIs, hosting, CORS, and local dev. Not needed for this demo/prototype project.
- **SQL DB, Custom Auth, or Third-party Email:** Would require more set up and are unnecessary for a rapid admin demo.

## Consequences
- Easiest local dev, deployment, and demo experience.
- Not as scalable as a microservices or separated approach; fine for admin MVP or demo.
- Can transition to more robust infra by porting API logic and swapping database.

## Authors
AI + [Your Name]

---
