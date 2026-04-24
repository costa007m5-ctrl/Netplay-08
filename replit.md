# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/netpremium` — NetPremium web app (React + Vite SPA, mounted at `/`). Ported from a Vercel/v0 import. Uses `react-router-dom`, Supabase, Firebase, TMDB, Socket.IO, motion, etc. Optional frontend env vars: `VITE_TMDB_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_DRIVE_API_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_ONESIGNAL_APP_ID`. Without these the app shows a built-in setup screen.
- `artifacts/api-server` — Express API (mounted at `/api`, plus `/auth/google/callback`). Ported routes that NetPremium calls: `POST /api/notifications/send`, `GET /api/stream/:fileId`, `POST /api/terabox/convert`, `GET /api/auth/google/url`, `GET /auth/google/callback`. Optional backend secrets: `GOOGLE_DRIVE_API_KEY`, `ONESIGNAL_REST_API_KEY`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `NOTIFICATIONS_ADMIN_KEY` (when set, requests to `/api/notifications/send` must include matching `x-admin-key` or `Authorization: Bearer` header).
- `artifacts/mockup-sandbox` — Canvas mockup sandbox.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
