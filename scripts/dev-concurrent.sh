#!/bin/bash

set -euo pipefail

PIDS=()
COMPOSE_CMD=()
SKIP_DOCKER="${SKIP_DOCKER:-0}"
START_WORKER="${START_WORKER:-1}"

cleanup() {
    for pid in "${PIDS[@]-}"; do
        kill "$pid" 2>/dev/null || true
    done
}

trap cleanup INT TERM EXIT

if [ "$SKIP_DOCKER" = "1" ]; then
    echo "Skipping Docker startup (SKIP_DOCKER=1). Expecting PostgreSQL, RabbitMQ, and DynamoDB endpoint to already be available."
else
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker CLI is not installed or not in PATH. Install Docker Desktop and retry, or run 'npm run dev:no-docker'."
        exit 1
    fi

    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD=(docker compose)
    elif command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD=(docker-compose)
    else
        echo "Docker Compose is not available. Install Docker Compose and retry, or run 'npm run dev:no-docker'."
        exit 1
    fi

    if ! docker info >/dev/null 2>&1; then
        echo "Docker daemon is not running. Start Docker Desktop, wait until it is ready, then run 'npm run dev' again, or use 'npm run dev:no-docker'."
        exit 1
    fi

    echo "Starting Docker services..."
    "${COMPOSE_CMD[@]}" up -d postgres rabbitmq localstack

    echo "Waiting for services to initialize..."
    sleep 5
fi

if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from backend/.env.example..."
    cp backend/.env.example backend/.env
fi

echo "Starting backend API..."
(cd backend && go run cmd/api/main.go) &
PIDS+=("$!")

if [ "$START_WORKER" = "1" ]; then
    echo "Starting backend worker..."
    (cd backend && go run cmd/worker/main.go) &
    PIDS+=("$!")
else
    echo "Skipping backend worker startup (START_WORKER=0)."
fi

echo "Starting web frontend..."
(npm --prefix web run dev) &
PIDS+=("$!")

wait "${PIDS[0]}"