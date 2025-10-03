# ADR-003: Server-side filtering for Students list (API route)

## Status
Accepted

## Context
The Recent Students widget on the Dashboard needs to support searching, filtering by status, progress threshold, and sorting by name without transferring the entire dataset to the client.

## Decision
- Implement a Next.js App Router API endpoint at `src/app/api/students/route.ts`.
- The endpoint uses Firebase Admin SDK to query Firestore and applies filtering/sorting server-side, returning up to 200 records at a time.
- The dashboard page calls this endpoint when controls change (search, status, progressMin, sort), resulting in smaller payloads and faster UI.

### Endpoint
`GET /api/students?limit=200&search=&status=All|Exploring|Applying|Submitted|Accepted&progressMin=0..100&sort=asc|desc`

- limit: capped at 200 for now
- search: case-insensitive substring on `name`
- status: optional exact match
- progressMin: derived on server from status → progress mapping (Exploring 20, Applying 50, Submitted 80, Accepted 100)
- sort: sort by name asc/desc

### Rationale
- Server-side filtering reduces client memory and data transfer.
- Establishes a clear place to move more filtering (e.g., Firestore composite queries) in the future.

## Consequences
- Requires Firebase Admin initialization on the server (API route). We reuse `serviceAccountKey.json` or `FIREBASE_ADMIN_SDK_KEY`.
- The dashboard now depends on the API route for filtered results.

## Future Work
- Replace in-memory filter with Firestore indexed queries per filter to handle very large datasets efficiently.
- Add pagination and total count headers.

## Authors
AI + You
