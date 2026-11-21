# Doomsday Ready

A minimal full-stack MCU rewatch planner and opening-night watch-party booking quote app.

## Tech stack

- React 18 + Vite + TypeScript
- Node.js 20 + Express + TypeScript
- PostgreSQL 16 and Drizzle ORM
- Vitest
- Docker Compose

The Feature 1 graph algorithms and Feature 2 booking algorithm are hand-written in plain TypeScript. No graph, toposort, knapsack, or coin-change solving library is used.

## Docker Compose

Docker Desktop must be running:

```bash
docker compose up --build
```

Open http://localhost:8080. The database uses a named volume. Stop it with `docker compose down`; reset it with `docker compose down -v`.

## Host development

```bash
docker compose up -d db
npm install
npm --prefix server install
npm --prefix client install
npm run db:generate
npm run migrate
npm run seed
npm run dev
```

The host database is published on port `55432` because port `5432` may be used by a local PostgreSQL instance.

## Commands

- `npm run dev` - start API and client
- `npm run build` - build both packages
- `npm test` - run server tests
- `npm run migrate` - apply migrations
- `npm run seed` - load sample data

## API

Base path: `/api`

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Check API availability (`/api/health` with the full base path) |
| POST | `/movies` | Create a movie |
| GET | `/movies` | List movies |
| GET | `/movies/:id` | Get one movie |
| PATCH | `/movies/:id` | Update a movie |
| DELETE | `/movies/:id` | Delete a movie |
| GET | `/movies/:id/rewatch-order` | Get prerequisites and stats |
| POST | `/cinemas` | Create a cinema |
| GET | `/cinemas` | List cinemas |
| GET | `/cinemas/:id` | Get a cinema |
| DELETE | `/cinemas/:id` | Delete a cinema and its bundle sizes |
| GET | `/cinemas/:id/booking?groupSize=N` | Get a booking quote |

Errors use `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.

Codes: `VALIDATION_ERROR`, `NOT_FOUND`, `DUPLICATE_TITLE`, `DUPLICATE_NAME`, `CIRCULAR_DEPENDENCY`, `INTERNAL_ERROR`.

## Data model

```mermaid
erDiagram
  MOVIES ||--o{ MOVIE_PREREQUISITES : "movie_id"
  MOVIES ||--o{ MOVIE_PREREQUISITES : "prerequisite_id"
  CINEMAS ||--|{ CINEMA_BUNDLE_SIZES : "sells"
  MOVIES {
    int id PK
    text title UK
    int release_year
    int runtime_minutes
    bool watched
  }
  MOVIE_PREREQUISITES {
    int movie_id PK, FK
    int prerequisite_id PK, FK
  }
  CINEMAS {
    int id PK
    text name UK
  }
  CINEMA_BUNDLE_SIZES {
    int cinema_id PK, FK
    int size PK
  }
```

## Algorithms

- Cycle detection uses an iterative prerequisite walk and runs in O(V + E).
- Rewatch order uses iterative depth-first post-order traversal and runs in O(V + E).
- Booking quotes use bottom-up dynamic programming with reconstruction and run in O(groupSize × bundleCount).

## Assumptions

- Titles and cinema names are unique case-insensitively.
- PATCH replaces the whole prerequisite set.
- "Not possible" is a `200` response with `possible: false`.
- Release years range from 1900 through 2100.
- If several minimum bundle combinations exist, one is returned.
- Sample prerequisite links are sample data, not an official watch guide.
- Missing prerequisite IDs are rejected with `400`.
