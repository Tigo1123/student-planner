# Student Planner API

## Local setup

1. Copy `.env.example` to `.env` and set a PostgreSQL connection and a strong JWT secret.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Apply the included migrations with `npm run prisma:migrate`.
5. Start the API with `npm run dev`.

Profile photos use an avatar-storage abstraction. Local development defaults to
an in-memory adapter, which is intentionally non-persistent and must never be
used in production. To exercise durable uploads locally, set
`AVATAR_STORAGE_PROVIDER=cloudinary` and provide `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Uploads are held in memory,
normalized to a 512×512 WebP image, and sent directly to Cloudinary; they are
never written to the API filesystem.

The frontend origin must match `FRONTEND_ORIGIN`. Authentication uses an HttpOnly cookie. Tasks and events are stored in PostgreSQL and every planner query is scoped to the authenticated user.

After an authenticated user confirms the prompt, legacy `planner_tasks` and
`planner_events` data can be imported once from that browser. PostgreSQL is the
primary planner store after migration.

Development uses a `SameSite=Lax` cookie. Production uses an HttpOnly,
`SameSite=None`, Secure cookie so the Render Static Site can call the Render backend.
Production state-changing requests must also carry an `Origin` matching
`FRONTEND_ORIGIN`.

## Production deployment: Render API and PostgreSQL

1. Create a Render PostgreSQL database. Start with a clean database; do not copy
   the local Docker database unless a separate data migration is planned.
2. Create a Render Web Service from this repository with
   `student-planner-api` as its root directory.
3. Configure these backend environment variables:
   - `DATABASE_URL`: Render's PostgreSQL connection URL.
   - `JWT_SECRET`: a unique production secret of at least 32 characters.
   - `FRONTEND_ORIGIN`: the exact HTTPS Render Static Site origin, without a trailing slash.
   - `NODE_ENV`: `production`.
   - `AVATAR_STORAGE_PROVIDER`: `cloudinary`.
   - `CLOUDINARY_CLOUD_NAME`: the Cloudinary product-environment cloud name.
   - `CLOUDINARY_API_KEY`: the backend-only Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: the backend-only Cloudinary API secret.
   Render supplies `PORT`; do not override it unless required.
4. Use `npm ci && npm run build` as the build command.
5. Use `npm run prisma:migrate:deploy` as the pre-deploy command. This applies
   committed migrations non-interactively and never resets the database.
6. Use `npm start` as the start command and `/api/health` as the health-check path.
7. Deploy, then confirm `https://<render-service>/api/health` returns
   `{ "status": "ok" }`.
8. Deploy `student-planner-react` as a Render Static Site with `VITE_API_URL` set to the exact
   HTTPS Render service origin.
9. After the final frontend domain is known, set `FRONTEND_ORIGIN` to that exact
   origin and redeploy or restart the backend.
10. Verify registration, login, logout, session restoration, and per-user planner
    isolation using the production test plan.

Generate a production JWT secret locally and paste only its output into Render:

```bash
openssl rand -base64 48
```

Never put the generated value in a repository file or a `VITE_` variable.

Render's pre-deploy command availability depends on service plan. If it is not
available, run `npm run prisma:migrate:deploy` as an explicit Render one-off job
before deploying the web service; do not substitute `migrate dev`, `db push`, or
`migrate reset`.

## Production test plan

1. Open production frontend.
2. Register User A.
3. Login.
4. Create Task.
5. Create Event.
6. Refresh.
7. Verify both persist.
8. Logout.
9. Login again.
10. Verify data returns.
11. Register User B.
12. Verify User A data is not visible.
13. Add User B data.
14. Switch back to User A.
15. Verify isolation.
16. Test task/event editing.
17. Test completion.
18. Test date reassignment.
19. Test Calendar markers.
20. Test Dashboard.
21. Test Today Summary.
22. Test mobile layout.
23. Check browser console.
24. Check backend logs.

## Password recovery

Configure `EMAIL_PROVIDER=resend`, `EMAIL_FROM` as an email address on a verified
sender domain, and `RESEND_API_KEY` in the hosting secret store. Production startup
requires configured delivery; development defaults to `EMAIL_PROVIDER=disabled`
and never logs reset links. Set `FRONTEND_ORIGIN` to the trusted frontend origin:
`http://localhost:5173` locally or the actual HTTPS frontend origin in production.
Reset links always use that origin, never a request Host header.

Apply `npm run prisma:migrate:deploy`, build/generate the API, deploy it, then
build/deploy the frontend. Existing accounts retain passwords and sessions.
Successful password resets invalidate all that user's earlier JWT cookies. Legacy
JWTs without a version remain valid at version zero until that user's first reset.
Authenticated requests now check the user's session version in PostgreSQL.

`POST /api/auth/forgot-password` accepts `{ "email": "..." }` and returns a generic
response, including unknown accounts or provider failures. Requests are limited
to 5 per IP and 3 per email per 15 minutes. Email-throttled requests also return
the generic success. `POST /api/auth/reset-password` accepts `token`, `password`,
and `confirmPassword`, with 15 attempts per IP per 15 minutes. Rate-limit stores
are process-local, matching existing auth limits; use a shared store before
scaling the API horizontally.

Recovery tokens are random 32-byte secrets, SHA-256 hashed in PostgreSQL, valid
for 20 minutes, and replaced on each accepted request. Successful reset atomically
consumes the token and increments the session version. Provider requests time
out after 4 seconds; valid forgot requests have a 5-second response floor to mask
normal delivery timing. Failed deliveries revoke that request's token and log a
redacted operational warning. Monitor provider health; users can request a new
link after a failure. No durable email retry queue is included.

Password rules remain the existing 8–128 character policy, using bcrypt at 12
rounds. Existing bcrypt behavior beyond 72 bytes is unchanged. Do not log request
bodies or frontend reset query parameters in proxies, analytics, or error tracking.

Run `npm test` and `npm run verify:password-recovery` with a disposable PostgreSQL
database. The integration test intercepts Resend calls in memory; it sends no
external emails. `scripts/verify-password-recovery-migration.sh` verifies the
migration against a pre-existing account in its guarded disposable database.
