#!/bin/sh
# Runs inside nginx:alpine's /docker-entrypoint.sh chain. Don't exec nginx here;
# the parent entrypoint will run CMD after we render the config.
set -e

export PORT="${PORT:-8080}"

if [ -z "${BACKEND_URL:-}" ]; then
  echo "WARNING: BACKEND_URL not set; API/socket requests will fail." >&2
  export BACKEND_URL="http://localhost:3001"
fi

export BACKEND_HOST=$(echo "$BACKEND_URL" | sed -E 's#^https?://##; s#/.*##')

echo "Rendering nginx: PORT=$PORT BACKEND_URL=$BACKEND_URL BACKEND_HOST=$BACKEND_HOST"
envsubst '$PORT $BACKEND_URL $BACKEND_HOST' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
