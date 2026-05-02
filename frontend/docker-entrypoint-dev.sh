#!/bin/sh
set -e
cd /app

# Bind mount replaces image files; anonymous /app/node_modules can start empty.
if [ ! -x node_modules/.bin/next ]; then
  echo "ticketiq-frontend: installing dependencies (npm ci)..."
  npm ci
fi

exec "$@"
