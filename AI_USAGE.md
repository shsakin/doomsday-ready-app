# AI Usage Disclosure

This document describes how AI tools were used while building **Doomsday Ready**, and where my own work begins and ends.

## Summary

| Area | Who did it |
| --- | --- |
| Logic for Feature 1 (circular dependency detection and rewatch order) | Me |
| Logic for Feature 2 (booking quote, fewest bundles for an exact seat count) | Me |
| Brainstorming, tech stack decisions and `BUILD_PLAN.md` | Me, together with Claude (Anthropic) |
| Building the application from the plan (backend, database layer, React frontend, Docker setup) | GitHub Copilot |
| Reviewing, understanding and verifying the code | Me |

## 1. Feature 1 and Feature 2 logic: written by me

The assessment requires the logic for Features 1 and 2 to be written without libraries that solve them, and to be my own work. I wrote the core algorithm logic for both features myself:

- **Feature 1:** detecting circular dependencies (direct and indirect) and producing the rewatch order, with each prerequisite appearing once and after its own prerequisites, along with the watched count and remaining runtime.
- **Feature 2:** finding the fewest bundles that add up to exactly the group size, and reporting how many of each size to buy, or that no exact combination exists.

No graph, topological-sort, dependency-resolution or coin-change libraries are used for any of this.

## 2. Planning: brainstormed with Claude

I used Claude as a planning partner. In that conversation, I:

- Had Claude read the assessment brief and helped turn it into a phased build plan, `BUILD_PLAN.md`.
- Discussed and chose the tech stack: React for the frontend, Node.js with Express and TypeScript for the backend, PostgreSQL for the database (chosen so the project can be deployed later), and Drizzle as the ORM.
- Decided on the API contract, validation rules, error codes, data model and the one-command Docker Compose setup.
- Decided how ambiguous points in the brief should be handled. These choices are recorded in the README under "Assumptions".

`BUILD_PLAN.md` also contains pseudo code for the Feature 1 and Feature 2 algorithms, which was drafted during this planning conversation so that the build instructions would be complete. The logic itself and its correctness are something I understand and own, as described in section 4.

Claude was used for planning and documentation only. It was not used to write the application code.

## 3. Implementation: built with GitHub Copilot

The application was built by following `BUILD_PLAN.md` phase by phase with GitHub Copilot. This covered the project scaffolding, database schema and migrations, the movies and cinemas API, the React frontend and the Docker Compose setup.

## 4. My review and understanding

AI-generated code was not accepted blindly. I reviewed what Copilot produced, and I understand how the project works:

- I can explain how circular dependencies are detected, why the rewatch order is valid, and how the booking quote finds the true minimum (and why a greedy approach would fail on cases like bundle sizes 1, 3, 4 with a group of 6).
- I can explain the data model, the API behaviour and error handling, and how the frontend talks to the API.
- I checked the results against the examples in the brief, including the rewatch orders, the `409 CIRCULAR_DEPENDENCY` case and the four booking examples.

