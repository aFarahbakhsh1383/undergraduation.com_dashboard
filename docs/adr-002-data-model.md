# ADR-002: Firestore Data Model for Student CRM

## Status
Accepted

## Context
The admin dashboard needs to efficiently store and display each student's journey—basic info, AI engagement, college applications (with rich college info), essays, activities, documents, and communication.

Firestore structure must balance:
- Easy admin queries/filtering
- Nested, many-to-many, or growing lists (colleges, essays, activities, logs)
- Simplicity for MVP iteration

## Decision

**Main collections:**
- `students` (document per student)
    - Basic info: name, email, phone, school year/grade, gpa, profilePicUrl
    - Academic prefs: preferred majors/states, class size, tuition, scores
    - Docs: profilePicUrl, resumeUrl
    - `interactions` (subcollection)
    - `communications` (subcollection)
    - `notes` (subcollection)
    - `colleges` (subcollection)
        - Info: name, logoUrl, city/state, overview/about, admissions/cost, majors, demographics, outcomes, contacts, ...
    - `essays` (subcollection)
        - prompt, text, status, submittedAt
    - `activities` (subcollection)
        - name, category, description, achievements, timeSpent

### Why subcollections for colleges/essays/activities?
- **Flexibility/scale**: Students may apply to 1 or 100 colleges; essays and activities can grow or be updated independently.
- **Rich details**: Each college can store many fields and related doc info (resume link, essays per application, attachments, etc.).
- **Efficient queries**: Retrieve subsets as needed (eg. list all students applying to a school, batch process only activities).
- **Future-proof**: Enables richer joins, audit logging, multi-admin concurrency.
- **Alignment with Firestore best practice**: Avoids 1MB doc limits and array update conflicts.

### Alternatives considered:
- **Single doc for all (arrays):** Simpler but hits size limits quickly, slower queries, awkward update logic.
- **Cross-student global collections:** Unnecessary for this scope (would use for global colleges list in future).

## Example Structure
- students/{studentId}
    - interactions/{...}
    - notes/{...}
    - communications/{...}
    - colleges/{collegeId}
    - essays/{essayId}
    - activities/{activityId}

## Consequences
- Simple access to summary info (from top-level student doc)
- All CRUD ops for attached records (colleges/essays/activities) are isolated per student
- MVP ready for dashboard; extensible for future app logic!

## Authors
AI + [Your Name]

---
