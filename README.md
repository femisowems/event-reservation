# Booking Appointment

This repository contains a full-stack booking and reservation demo built to show a production-style workflow across a Go backend, a React web app, and an Ionic mobile app.

## Overview

The backend follows a hexagonal architecture and uses PostgreSQL as the system of record, RabbitMQ for event delivery, and DynamoDB via LocalStack for the read model. The frontends consume the same reservation workflow from different device targets.

## Architecture

The core flow is:

1. A client creates a reservation through the API.
2. The API stores the reservation in PostgreSQL.
3. The API emits a `ReservationCreated` event.
4. The worker consumes the event and updates the DynamoDB read model.
5. Notifications and downstream projections can be added from the same event stream.

Technology highlights:

- Backend: Go 1.23+ with a hexagonal structure in `backend/pkg`
- Primary database: PostgreSQL
- Messaging: RabbitMQ
- Local AWS emulation: LocalStack for DynamoDB
- Web frontend: React 19, Vite, PrimeReact
- Mobile frontend: Ionic 8, Angular 20, Capacitor 8

## Repository Layout

- `backend/` contains the Go API, worker, migrations, and supporting packages.
- `web/` contains the Vite-based React client.
- `mobile/` contains the Ionic/Angular mobile client.
- `docker-compose.yml` defines the local infrastructure stack.
- `start-backend.sh` boots the infrastructure and starts the Go API.

## Prerequisites

Install these tools before running the project locally:

- Docker and Docker Compose
- Go 1.23 or newer
- Node.js 20 or newer
- npm 10 or newer

## Configuration

Copy the backend example environment file before starting the API:

```bash
cd backend
cp .env.example .env
```

The backend expects these values at minimum:

- `PORT`
- `DATABASE_URL`
- `RABBITMQ_URL`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ENDPOINT_URL` when using LocalStack

## Local Development

### Quick start

Run the concurrent developer workflow from the repository root to bring up infrastructure and start the API, worker, and web app together:

```bash
npm run dev
```

That command starts Docker Compose services, creates `backend/.env` from the example file if needed, and then launches `cmd/api`, `cmd/worker`, and the web dev server together.

If Docker is unavailable, you can still run concurrent development without Docker:

```bash
npm run dev:no-docker
```

`dev:no-docker` starts API + web and skips the worker by default so RabbitMQ is not required.

If you want the worker included without Docker, use:

```bash
npm run dev:no-docker:full
```

For `dev:no-docker`, provide PostgreSQL (and optionally RabbitMQ if you run the full variant):

- PostgreSQL at `DATABASE_URL` (or local default)
- RabbitMQ at `RABBITMQ_URL` for `dev:no-docker:full`
- DynamoDB-compatible endpoint at `AWS_ENDPOINT_URL` for `dev:no-docker:full` (or local default `http://localhost:4566`)

If PostgreSQL is unavailable, the API falls back to in-memory reservation storage for local development. In that mode, reservation data is not persisted across process restarts.

If you want backend-only startup, run:

```bash
npm run dev:backend
```

That command starts Docker Compose and then launches only `cmd/api`.

### Run the pieces manually

1. Start infrastructure:

```bash
docker-compose up -d postgres rabbitmq localstack
```

2. Prepare backend configuration:

```bash
cd backend
cp .env.example .env
```

3. Start the backend API:

```bash
cd backend
go run cmd/api/main.go
```

4. Start the worker in a separate terminal:

```bash
cd backend
go run cmd/worker/main.go
```

5. Start the web app:

```bash
npm --prefix web install
npm run dev:web
```

6. Start the mobile app:

```bash
npm --prefix mobile install
npm run dev:mobile
```

## Useful Scripts

The root `package.json` provides convenience commands for each part of the repo:

- `npm run dev` starts the backend API, backend worker, and web dev server together.
- `npm run dev:no-docker` starts backend API + web dev server without Docker startup (worker skipped).
- `npm run dev:no-docker:full` starts backend API + worker + web dev server without Docker startup.
- `npm run dev:backend` starts only the backend API after the infrastructure comes up.
- `npm run start:infra` starts only the infrastructure containers.
- `npm run start:backend` launches the Go API.
- `npm run start:worker` launches the Go worker.
- `npm run build:web` builds the React web app.
- `npm run build:mobile` builds the Ionic mobile app.
- `npm run build:backend` compiles the Go services.
- `npm run build:all` runs the web, mobile, and backend builds in sequence.
- `npm run test:backend` runs Go tests across the backend module.
- `npm run lint:web` runs the web linter.
- `npm run lint:mobile` runs the mobile linter.

## Ports and Services

- API: `http://localhost:8080`
- Postgres: `localhost:5432`
- RabbitMQ management UI: `http://localhost:15672`
- LocalStack: `http://localhost:4566`
- Web app dev server: `http://localhost:5173`
- Mobile app dev server: `http://localhost:4200`

## Backend Structure

The backend module is organized to keep business logic isolated from infrastructure details:

- `backend/cmd/api` exposes the HTTP API.
- `backend/cmd/worker` runs asynchronous event processing.
- `backend/pkg/core` holds the domain and application logic.
- `backend/pkg/adapters` contains storage, messaging, and external service adapters.
- `backend/pkg/bootstrap` wires dependencies together.
- `backend/migrations` contains the PostgreSQL schema history.

## Observability

The API exposes metrics at `http://localhost:8080/metrics`. Requests include an `X-Correlation-ID` header to help trace a request across services.

## Production Notes

Build the backend image from the backend directory when you want to deploy the API container:

```bash
docker build -t reservation-api ./backend
```

Run it with the production environment variables required by your database and message broker:

```bash
docker run -d \
  -p 8080:8080 \
  -e PORT=8080 \
  -e DATABASE_URL="postgres://user:pass@host:5432/dbname" \
  -e RABBITMQ_URL="amqp://user:pass@host:5672/" \
  reservation-api
```

The repository also includes `vercel.json` files for deployments that target Vercel-compatible runtimes.

### Vercel deployment strategy (recommended)

Vercel is best used here for the web frontend only. The Go API and worker should run on a service that supports long-running processes (for example Railway, Render, Fly.io, or ECS).

- Deploy `web` to Vercel.
- Deploy `backend/cmd/api` to your backend host.
- Deploy `backend/cmd/worker` as a separate long-running process on your backend host.
- Use managed Postgres and RabbitMQ in production.

In this repository, root `vercel.json` rewrites `/api/*` to the Railway backend URL. That avoids relying on Vercel serverless functions for the worker-dependent backend architecture.

## Troubleshooting

- If Docker Compose fails, confirm that ports `5432`, `5672`, `15672`, and `4566` are free.
- If the backend cannot connect to PostgreSQL or RabbitMQ, re-check the values in `backend/.env`.
- If the web or mobile app fails to start, reinstall dependencies in that subproject with `npm --prefix <folder> install`.
- If LocalStack is unreachable, verify that Docker is running and the container is healthy before starting the API.

## License

MIT
