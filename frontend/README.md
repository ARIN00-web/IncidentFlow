# IncidentFlow frontend

A mock-data-driven, production-style incident-management UI built with Next.js, React, and TypeScript.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
npm run build
```

## Routes

- `/` — product landing page
- `/login`, `/register` — authentication UI boundaries
- `/dashboard` — operations overview
- `/incidents`, `/incidents/new`, `/incidents/[id]` — registry and incident room
- `/teams`, `/analytics`, `/settings`

## Architecture

- `src/components` contains shared shell, primitives, and incident UI.
- `src/lib/types.ts` defines strict application types.
- `src/lib/mock-data.ts` isolates all realistic display data for simple API replacement.
- `src/hooks/useIncidentSocket.ts` is the future Socket.IO event boundary.

## Environment

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are documented in `.env.example`. No real API or WebSocket connection is initiated by this UI.

Backend integration is intentionally left as the final integration step. Replace the explicit boundaries in `lib/api.ts`, `lib/auth.ts`, authentication forms, and `useIncidentSocket.ts` when the backend is ready.
