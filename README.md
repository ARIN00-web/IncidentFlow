# IncidentFlow

Production-style incident management backend built with:

- NestJS
- TypeScript
- PostgreSQL
- JWT + Argon2
- Valkey / Redis
- BullMQ
- WebSockets
- Optional Kafka

## Local setup

1. Copy environment:

```bash
cp .env.example .env
```

2. Start PostgreSQL + Valkey:

```bash
docker compose up -d postgres valkey
```

If you already installed PostgreSQL/Valkey with Homebrew, you can use those instead.

3. Install packages:

```bash
npm install
```

4. Run migrations:

```bash
npm run migration:run
```

5. Start API:

```bash
npm run start:dev
```

API: http://localhost:3000/api

Health:

```bash
curl http://localhost:3000/api/health
```

## Auth

Register:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Arin","email":"arin@example.com","password":"password123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"arin@example.com","password":"password123"}'
```

Copy the returned accessToken.

## Incident API

Create:

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Production API Down","severity":"CRITICAL"}'
```

List:

```bash
curl http://localhost:3000/api/incidents \
  -H "Authorization: Bearer $TOKEN"
```

Get:

```bash
curl http://localhost:3000/api/incidents/1 \
  -H "Authorization: Bearer $TOKEN"
```

Update:

```bash
curl -X PATCH http://localhost:3000/api/incidents/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"ACKNOWLEDGED"}'
```

Assign:

```bash
curl -X POST http://localhost:3000/api/incidents/1/assign/1 \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket

Namespace:

```text
/incidents
```

Client emits:

```json
{"event":"join-incident","incidentId":1}
```

Server emits:

```text
incident.updated
```

## Kafka

Kafka is deliberately optional.

Default:

```env
KAFKA_ENABLED=false
```

Enable it only when Kafka is running:

```env
KAFKA_ENABLED=true
```

Then:

```bash
docker compose --profile kafka up -d
```

## Production notes

Before real production use:

- put JWT secret in a secret manager
- use managed PostgreSQL/Valkey
- add real Slack/email provider
- add Kafka consumer/outbox publisher
- add rate limiting
- add structured logging/metrics/tracing
- terminate TLS at the load balancer
- run API and workers as separate processes/containers
