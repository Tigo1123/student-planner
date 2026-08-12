# Student Planner API

## Local setup

1. Copy `.env.example` to `.env` and set a PostgreSQL connection and a strong JWT secret.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Apply the included migrations with `npm run prisma:migrate`.
5. Start the API with `npm run dev`.

The frontend origin must match `FRONTEND_ORIGIN`. Authentication uses an HttpOnly cookie. Tasks and events are stored in PostgreSQL and every planner query is scoped to the authenticated user.

After an authenticated user confirms the prompt, legacy `planner_tasks` and
`planner_events` data can be imported once from that browser. PostgreSQL is the
primary planner store after migration.

Development uses a `SameSite=Lax` cookie. Production uses an HttpOnly,
`SameSite=None`, Secure cookie so a Vercel frontend can call a Render backend.
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
   - `FRONTEND_ORIGIN`: the exact HTTPS Vercel origin, without a trailing slash.
   - `NODE_ENV`: `production`.
   Render supplies `PORT`; do not override it unless required.
4. Use `npm ci && npm run build` as the build command.
5. Use `npm run prisma:migrate:deploy` as the pre-deploy command. This applies
   committed migrations non-interactively and never resets the database.
6. Use `npm start` as the start command and `/api/health` as the health-check path.
7. Deploy, then confirm `https://<render-service>/api/health` returns
   `{ "status": "ok" }`.
8. Deploy `student-planner-react` to Vercel with `VITE_API_URL` set to the exact
   HTTPS Render service origin.
9. After the final Vercel domain is known, set `FRONTEND_ORIGIN` to that exact
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
