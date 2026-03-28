# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains two products: **LevelUpAuto** (auto shop website + mobile app) and **Alset** (multi-sided Tesla owner platform).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Artifacts

| Artifact | Path | Description |
|---|---|---|
| `api-server` | `/api` | Shared Express API server for all artifacts |
| `levelupauto-web` | `/` | LevelUpAuto auto shop website (React + Vite) |
| `levelupauto-mobile` | `/mobile/` | LevelUpAuto mobile app (Expo) |
| `alset-web` | `/alset/` | Alset multi-sided platform (React + Vite) |

## Products

### LevelUpAuto

Auto repair shop website and mobile companion app.

**Website pages**: Home, Services, Book Appointment, Testimonials, Contact

**API routes**:
- `GET /api/services`
- `GET/POST /api/appointments`
- `GET /api/testimonials`
- `POST /api/contact`

**Seed**: `pnpm --filter @workspace/scripts run seed`

### Alset

Multi-sided platform for Tesla vehicle owners. CIECA/BMS-inspired insurance integration.

**Roles**: owner, shop, insurer, towing, rental, admin

**Demo accounts** (all password: `demo123`):
- `owner@alset.com` — Tesla Owner portal
- `shop@alset.com` — Repair Shop portal
- `insurer@alset.com` — Insurance Adjuster portal
- `towing@alset.com` — Towing Dispatcher portal
- `rental@alset.com` — Rental Company portal
- `admin@alset.com` — Admin (full access)

**Portals**: Dashboard, Vehicles, Insurance Claims, Work Orders, Towing Jobs, Loaner/Rental

**API routes** (all under `/api/alset/`):
- `POST /auth/login`, `GET /auth/me`
- `GET/POST /vehicles`, `GET /vehicles/:id`
- `GET/POST /claims`, `GET /claims/:id`, `PATCH /claims/:id`
- `GET/POST /work-orders`, `GET /work-orders/:id`, `PATCH /work-orders/:id`
- `GET/POST /towing`, `PATCH /towing/:id`
- `GET/POST /rentals`, `PATCH /rentals/:id`
- `GET /dashboard/stats`

**Seed**: `pnpm --filter @workspace/scripts run seed-alset`

## Database Schema

### LevelUpAuto Tables
- `services` — auto repair services catalog
- `appointments` — customer appointment bookings
- `testimonials` — customer reviews
- `contacts` — contact form submissions

### Alset Tables
- `alset_organizations` — shop/insurer/towing/rental companies
- `alset_users` — users with roles
- `alset_vehicles` — Tesla vehicle registry
- `alset_claims` — insurance claims (CIECA/BMS-style)
- `alset_work_orders` — shop work orders
- `alset_towing` — towing dispatch jobs
- `alset_rentals` — loaner/rental bookings

## Auth

Alset uses simple JWT tokens (base64-encoded, server-verified). Tokens stored in localStorage on the client. No sessions. Password hashing via SHA-256 + salt.

## Structure

```
artifacts/
  api-server/          Express API server (shared)
  levelupauto-web/     LevelUpAuto website
  levelupauto-mobile/  LevelUpAuto Expo mobile app
  alset-web/           Alset multi-sided platform
lib/
  api-spec/            OpenAPI 3.1 spec + Orval codegen config
  api-client-react/    Generated React Query hooks
  api-zod/             Generated Zod schemas
  db/                  Drizzle ORM schema + DB connection
scripts/
  src/seed.ts          LevelUpAuto seed data
  src/seed-alset.ts    Alset seed data
```
