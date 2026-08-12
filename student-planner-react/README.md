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

## Vercel deployment

- Root directory: `student-planner-react`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<render-service-domain>`

The included `vercel.json` rewrites application paths to `index.html`, so direct
visits to `/login`, `/register`, and `/app` work with React Router. Set
`VITE_API_URL` for Production (and any Preview environment you intend to test),
then redeploy after changing it because Vite embeds the value at build time.

The Render API's `FRONTEND_ORIGIN` must exactly match the final Vercel HTTPS
origin and must not include a trailing slash.
