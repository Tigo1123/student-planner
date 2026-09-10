# Student Planner React

The authenticated Student Planner frontend. Calendar, tasks, school events,
dashboard summaries, and date reassignment are rendered with React. Planner
records are loaded from the Student Planner API and scoped to the signed-in user.

## Local setup

1. Install dependencies with `npm install`.
2. Set `VITE_API_URL` to the Student Planner API origin (for example,
   `http://localhost:4000`).
3. Start the app with `npm run dev`.

The API must allow this frontend origin and accept credentialed requests. JWTs
remain in the API's HttpOnly session cookie and are never read by this app.

## Render Static Site deployment

- Root directory: `student-planner-react`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<render-service-domain>`

Configure Render's rewrite rule from `/*` to `/index.html`, so direct visits to
`/login`, `/register`, `/forgot-password`, `/reset-password`, `/onboarding`, and `/app` work with React Router. Set
`VITE_API_URL` for Production (and any Preview environment you intend to test),
then redeploy after changing it because Vite embeds the value at build time.

The Render API's `FRONTEND_ORIGIN` must exactly match the final frontend HTTPS
origin and must not include a trailing slash.

Password recovery uses the API's configured `FRONTEND_ORIGIN` to build reset links.
Keep the existing Render `/*` → `/index.html` rewrite (not a redirect); query
parameters must be preserved. The HTML sets `Referrer-Policy` via a no-referrer
meta tag to protect reset links. Do not collect reset URL query strings in analytics.
