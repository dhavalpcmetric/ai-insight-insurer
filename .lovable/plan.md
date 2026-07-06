
## 1. Fix current build failure

Prior turn upgraded `@tanstack/react-start` to `^1.168.26` but left `@tanstack/react-router` and `@tanstack/router-plugin` on `^1.167/168.25`. The newer `react-start` imports `getScriptPreloadAttrs` from `@tanstack/router-core` — the older transitive version doesn't export it → Rollup `MISSING_EXPORT` on SSR build.

Bump the TanStack trio to the same minor:
- `@tanstack/react-router` → `^1.168.26`
- `@tanstack/router-plugin` → `^1.168.26`

Run `bun install`, verify `build:dev` is green.

## 2. Wire your upload endpoint

Small edit to `src/routes/upload.tsx`:
- Endpoint URL is read from `VITE_LEADS_UPLOAD_URL` (fallback `/upload-leads`).
- Keep the existing multipart POST with field `file`; response normalizer already accepts scored-leads JSON.
- Add response-time + row-count line under the status banner.
- Keep local-parse fallback so demos still work if the tunnel is down.

**You do:**
- Start ngrok / Cloudflare tunnel to `127.0.0.1:8500` → get an HTTPS URL.
- Enable CORS on `/upload-leads` for the preview origin (`https://id-preview--*.lovable.app`) and published origin.
- Set env var `VITE_LEADS_UPLOAD_URL=https://<your-tunnel>/upload-leads` in the project.

## 3. IBM watsonx.ai agent — orchestrator wiring

Single orchestrator call, server-side only (no IBM key in the browser).

**Secrets to add** (via `add_secret`, one time):
- `IBM_CLOUD_API_KEY`
- `WATSONX_AGENT_URL` — the deployed agent's `/ai_service` (non-stream) endpoint URL
- `WATSONX_PROJECT_ID` (or `WATSONX_SPACE_ID`)

**New server function** `src/lib/watsonx.functions.ts`:
- `runLeadWorkflow({ lead })` returns `{ stages: { intake, prioritization, risk, pricing, recommendation, manager } }`
- Handler steps:
  1. Exchange `IBM_CLOUD_API_KEY` → IAM bearer token at `https://iam.cloud.ibm.com/identity/token` (cache in module scope ~50 min).
  2. POST the lead JSON to `WATSONX_AGENT_URL` with `Authorization: Bearer <token>` and system prompt telling the agent to reply strictly in the 6-key JSON shape.
  3. Zod-validate the reply; on schema miss, return `{ error, stages: null }`.

**Update `src/routes/workflow.tsx`:**
- Replace the hardcoded `agents` array with data from `runLeadWorkflow` (TanStack Query via `useServerFn` + `useQuery`, keyed by `leadId`).
- Show per-stage skeletons while pending; show error banner on failure.
- "Next lead" button re-queries for the next lead.

## What your IBM/backend side must expose

| Purpose | Method | URL |
|---|---|---|
| Upload + score Excel | POST multipart | your tunnel `/upload-leads` |
| Run 6-stage workflow on one lead | POST JSON | watsonx.ai deployed agent URL |

Everything else (dashboard KPIs, lead list, notifications) stays on mock data until you're ready — flagging endpoints for those was covered in the earlier endpoint-list message.

## Technical notes

- `LOVABLE_API_KEY` is not used here — you're calling IBM directly.
- Never `VITE_`-prefix IBM secrets; read them inside `.handler()` only.
- IAM token cache lives in a `.server.ts` helper, imported only from the server fn handler.
- Preview URL cannot reach `127.0.0.1`; the tunnel is mandatory for the upload path. The IBM path goes through our server fn, so no tunnel needed for that.
