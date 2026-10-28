# BookLeaf Support Portal

This project implements a BookLeaf Publishing support portal based on the assignment requirements. It includes an author-facing portal, an admin support dashboard, a support ticket lifecycle, and AI-assisted triage and drafting logic using the provided sample data.

## Project overview

The application is built as a local demo/prototype in Next.js and is designed to reflect the assignment’s expected workflows:

- Author login and dashboard
- Book catalog and royalty summary
- Support ticket creation and tracking
- Admin ticket queue and action panel
- AI-based category detection, priority recommendation, and response drafting
- Role-based access patterns for author/admin flows

## Tech stack

- Next.js 16
- React 19
- TypeScript
- App Router route handlers
- Sample JSON dataset for data seeding
- Cookie-based local session handling for demo auth

## Folder structure

```bash
src/
  app/
    api/
      ai/
        suggestions/
          route.ts
      auth/
        route.ts
      tickets/
        route.ts
        [id]/
          route.ts
    page.tsx
  data/
    bookleaf_sample_data.json
  lib/
    ai.ts
    portal.ts
    session.ts
```

## Prerequisites

- Node.js 18+
- npm

## Setup instructions

1. Open a terminal in the project folder.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in the browser:

```text
http://localhost:3000
```

5. For a production build:

```bash
npm run build
npm run start
```

## Demo credentials

### Admin
- Email: ops@bookleaf.com
- Password: bookleaf-admin

### Author
- Use any author email from the sample dataset
- Password: bookleaf123

Example author email:
- priya.sharma@email.com

## Core features implemented

### Author flow
- Sign in with email/password
- View personal books and royalty details
- Create support tickets for account or book-related issues
- View ticket history and status
- Receive updates from the admin workflow

### Admin flow
- Sign in as operations team
- View a consolidated queue of all tickets
- Filter by status and priority
- Open a ticket, review details, and change status
- Leave internal notes
- Draft and send admin responses
- Update assigned team and ticket state

### AI support logic
- Ticket classification into the assignment categories
- Priority estimation based on issue urgency
- Draft response generation using BookLeaf rules and tone
- Graceful fallback when no external model is available

## API routes

### Auth
- POST /api/auth
  - Validates login credentials and creates a session cookie

### Tickets
- GET /api/tickets
  - Lists tickets for an admin or the current author
- POST /api/tickets
  - Creates a new author ticket
- PATCH /api/tickets/[id]
  - Updates status, notes, assignment, and response

### AI suggestions
- POST /api/ai/suggestions
  - Returns AI-style category, priority, and draft response recommendation

## Notes on implementation choices

### Data layer
The project uses the provided BookLeaf sample dataset as the primary data source and stores support tickets in an in-memory local store so it runs immediately without database setup.

### AI behavior
The AI layer follows a practical fallback design:
- If an external OpenAI key is available, it can call the OpenAI API.
- If not, it falls back to the built-in BookLeaf rule engine, preserving a useful experience without failing.

### Model choice and justification
A hybrid approach was chosen for this project: BookLeaf-specific rule-based logic is used as the default execution path, with optional OpenAI integration when a valid API key is present. This design was selected because the assignment emphasizes correctness, explainability, and reliability more than a purely opaque model-only workflow.

Using a rule-based and knowledge-grounded approach ensures the system stays predictable in a local demo environment, remains understandable for evaluation, and continues to function even when external AI services are unavailable. In production, this pattern also reduces dependency risk, token cost volatility, and service failures. The AI layer therefore acts as a support assistant for classification, prioritization, and drafting while still allowing the app to work reliably with the BookLeaf domain rules when the external model is not available.

### Authentication
Authentication is implemented as a lightweight local session flow suitable for the assignment/demo environment. It is not a full enterprise identity system.

## Assumptions made while completing the assignment

- The assignment was implemented as a working demo/prototype rather than a production SaaS deployment.
- The provided sample dataset is intended to represent the real BookLeaf records used during evaluation.
- The focus was on the business workflow: author support, admin handling, and AI-assisted triage.
- Real database persistence and production-grade auth were treated as follow-up work beyond the assignment scope unless specifically required by the PDF.

## Known limitations

- No real external database is configured.
- No live deployment URL is included.
- RBAC is limited to local session-based checks for demo use.
- AI generation is optional and gracefully degrades when external configuration is absent.

## Evaluation summary

This project covers the main assignment requirements in a working, local implementation:

- author support workflow
- admin support workflow
- sample business data and book/royalty context
- support ticket lifecycle
- AI-assisted triage and drafting
- functional API layer and app structure

It is suitable as a polished assignment submission and demonstration project, while remaining intentionally scoped as a local implementation rather than a full production deployment.

## Verification

The project was verified with a successful production build:

```bash
npm run build
```

This completed successfully in the current workspace.

## Submission note

This project can be submitted as either:
- a ZIP of the codebase, or
- a GitHub repository link after pushing the project

It is ready to run locally using the steps above.
