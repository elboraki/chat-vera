#!/usr/bin/env bash
# Deploy VeraChat to Google Cloud Run.
# Usage: ./deploy.sh [server|client|all]
#
# Required environment variables:
#   PROJECT_ID    - your GCP project id
#   REGION        - e.g. europe-west1, us-central1
#   MONGODB_URI   - your MongoDB Atlas connection string
#   JWT_SECRET    - random secret for JWT signing

set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${REGION:?Set REGION (e.g. europe-west1)}"
: "${MONGODB_URI:?Set MONGODB_URI (Atlas connection string)}"
: "${JWT_SECRET:?Set JWT_SECRET}"

SERVER_SVC="${SERVER_SVC:-verachat-server}"
CLIENT_SVC="${CLIENT_SVC:-verachat-client}"
TARGET="${1:-all}"

echo "Project: $PROJECT_ID  Region: $REGION"
gcloud config set project "$PROJECT_ID" >/dev/null
gcloud config set run/region "$REGION" >/dev/null

deploy_server() {
  echo "=== Building & deploying server ==="
  gcloud run deploy "$SERVER_SVC" \
    --source . \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3 \
    --timeout 3600 \
    --session-affinity \
    --set-env-vars "NODE_ENV=production,MONGODB_URI=${MONGODB_URI},JWT_SECRET=${JWT_SECRET}"
  # CLIENT_URL is set after the client is deployed (see deploy_client).
}

deploy_client() {
  echo "=== Resolving server URL ==="
  SERVER_URL=$(gcloud run services describe "$SERVER_SVC" \
    --region "$REGION" --format='value(status.url)')
  if [ -z "$SERVER_URL" ]; then
    echo "ERROR: $SERVER_SVC not found; deploy server first." >&2
    exit 1
  fi
  echo "Server URL: $SERVER_URL"

  echo "=== Building & deploying client ==="
  gcloud run deploy "$CLIENT_SVC" \
    --source ./client \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3 \
    --session-affinity \
    --set-env-vars "BACKEND_URL=${SERVER_URL}"

  CLIENT_URL=$(gcloud run services describe "$CLIENT_SVC" \
    --region "$REGION" --format='value(status.url)')
  echo "Client URL: $CLIENT_URL"

  echo "=== Updating server CLIENT_URL for CORS ==="
  gcloud run services update "$SERVER_SVC" \
    --region "$REGION" \
    --update-env-vars "CLIENT_URL=${CLIENT_URL}"

  echo
  echo "App is live at: $CLIENT_URL"
}

case "$TARGET" in
  server) deploy_server ;;
  client) deploy_client ;;
  all)    deploy_server; deploy_client ;;
  *) echo "Unknown target: $TARGET (use server|client|all)"; exit 1 ;;
esac
