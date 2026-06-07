# Deploying VeraChat to Google Cloud Run

Two Cloud Run services (`verachat-server` and `verachat-client`) + MongoDB Atlas.

## Why your previous deploy failed

The error `The user-provided container failed to start and listen on the port defined provided by the PORT=8080` means the container never started listening on `0.0.0.0:8080`. Cloud Run **always** sets `PORT=8080` and your process must bind it.

The fixes that have now been applied:

| File | Fix |
|---|---|
| `src/index.js` | Now binds `0.0.0.0` (not localhost) and reads `process.env.PORT` |
| `src/config/db.js` | No longer `process.exit(1)` on DB failure (would kill container before listen) |
| `Dockerfile` | Prod target sets `PORT=8080`, slimmer with prod-only deps |
| `client/nginx.conf.template` | Listens on `${PORT}`, proxies to `${BACKEND_URL}` (rendered at runtime) |
| `client/docker-entrypoint.sh` | Renders template using env vars when the container starts |
| `client/Dockerfile` | Uses template + entrypoint, sets `PORT=8080` |

---

## Prerequisites

1. **MongoDB Atlas** (free M0 tier is fine):
   - Create cluster: https://www.mongodb.com/cloud/atlas
   - Database Access → create a user with password
   - Network Access → add `0.0.0.0/0` (or Cloud Run's static IP via Serverless VPC)
   - Get the SRV connection string, e.g. `mongodb+srv://user:pass@cluster.xxx.mongodb.net/verachat?retryWrites=true`

2. **gcloud CLI** authenticated and pointed at your project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable required APIs** (one-time):
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```

---

## Deploy (one command)

From the repo root:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="europe-west1"            # or us-central1, etc.
export MONGODB_URI="mongodb+srv://user:pass@cluster.xxx.mongodb.net/verachat?retryWrites=true"
export JWT_SECRET="$(openssl rand -hex 32)"

./deploy.sh all
```

The script will:

1. Build & deploy `verachat-server` from `./Dockerfile`
2. Read the server's public URL
3. Build & deploy `verachat-client` from `./client/Dockerfile` with `BACKEND_URL=<server URL>`
4. Update the server with `CLIENT_URL=<client URL>` so CORS works

At the end it prints the **client URL** — that's your app.

---

## Deploy each piece separately

```bash
./deploy.sh server       # backend only
./deploy.sh client       # client only (server must already exist)
```

---

## Manual gcloud commands (if you don't want the script)

### Server
```bash
gcloud run deploy verachat-server \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --session-affinity \
  --timeout 3600 \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=...,JWT_SECRET=..."
```

### Client (after server is up)
```bash
SERVER_URL=$(gcloud run services describe verachat-server --region europe-west1 --format='value(status.url)')

gcloud run deploy verachat-client \
  --source ./client \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --session-affinity \
  --set-env-vars "BACKEND_URL=${SERVER_URL}"

CLIENT_URL=$(gcloud run services describe verachat-client --region europe-west1 --format='value(status.url)')

gcloud run services update verachat-server \
  --region europe-west1 \
  --update-env-vars "CLIENT_URL=${CLIENT_URL}"
```

---

## WebSockets on Cloud Run — important flags

Socket.IO needs these or you'll see disconnects / 502s:

- `--session-affinity` — pins a client to the same instance so socket state survives
- `--timeout 3600` — long-lived connections (default is 5 min)
- `--min-instances 1` (optional) — avoids cold starts on first connection

These are already in `deploy.sh`.

---

## Verify

```bash
# Health check
curl https://verachat-server-XXXX.run.app/api/health
# Should return {"status":"ok"}

# Logs (server)
gcloud run services logs read verachat-server --region europe-west1 --limit 50

# Logs (client)
gcloud run services logs read verachat-client --region europe-west1 --limit 50
```

---

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `failed to start and listen on PORT=8080` | App binds localhost or wrong port | Already fixed — make sure you rebuild |
| `Error: MONGODB_URI is not set` | Env var missing on the service | Re-deploy with `--set-env-vars` |
| `MongoServerSelectionError` | Atlas firewall blocks Cloud Run | Allow `0.0.0.0/0` in Atlas Network Access |
| CORS errors in browser | `CLIENT_URL` not set on server | Script sets it on step 4; re-run `deploy.sh all` |
| Socket connects then disconnects | No session affinity | Already enabled with `--session-affinity` |
| 502 on `/socket.io/` | Nginx template didn't render | Check `BACKEND_URL` is set on the client service |

---

## Costs (rough)

- Cloud Run: ~$0 for hobby traffic (2 million requests/month free tier)
- MongoDB Atlas M0: free forever (512 MB storage)
- Container Registry / Artifact Registry: a few cents/month for images
