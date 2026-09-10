# ONBOARDING IMPLEMENTATION REPORT

Final decision: **READY FOR QA**

Implemented and verified locally on 2026-09-09. Production was not modified or deployed.

## Architecture used

Five focused screens provide welcome, academic setup, timetable setup, goals, and completion. The existing teal, orange, cream, typography, form classes, rounded cards, and study illustration are reused. The existing timetable form and backend time/overlap validation are reused.

Setup is a server-side draft on the authenticated User. Added/removed records and step navigation save the draft with an optimistic revision check. Completion creates actual Course and ClassSchedule records and marks onboarding complete in one serializable database transaction. A user row lock, bounded serialization retries, and an already-completed check make completion safe under concurrent requests and retries. A failed timetable insert rolls back all setup records.

The transaction wrapper is necessary to avoid partial setup and duplicates on retries; ordinary course/timetable CRUD endpoints remain available and retain their existing behavior. Course creation accepts an optional transaction client, and timetable overlap validation is shared rather than duplicated.

Academic profile information and selected goals are used in a dashboard priorities section. Goals link to courses, deadlines, task quick-add, assignments/progress, and timetable. No new preference tables were introduced.

## Files changed

Backend paths are relative to `student-planner-api/`:

- `prisma/schema.prisma`: User onboarding state, revision, draft, and academic profile.
- `prisma/migrations/20260909000000_add_onboarding/migration.sql`: safe existing-account migration.
- `src/app.js`: mounts onboarding router.
- `src/modules/onboarding/onboarding.routes.js`: authenticated draft loading/saving and atomic completion.
- `src/modules/onboarding/onboarding.validation.js`: strict bounded schemas reusing course and schedule validation.
- `src/modules/users/user.service.js`: safe User responses include status/profile.
- `src/modules/auth/auth.service.js`: login returns the same status/profile fields.
- `src/modules/courses/courses.service.js`: optional transaction client for shared course creation.
- `src/modules/schedule/schedule.service.js`: exports existing overlap check.
- `tests/onboarding.test.js`: five validation tests.
- `scripts/onboarding-integration-check.js`: real API/database integration checks and fixture cleanup.
- `scripts/verify-onboarding-migration.sh`: guarded migration rehearsal using an empty disposable local database.
- `package.json`: unit and onboarding integration commands.

Frontend paths are relative to `student-planner-react/`:

- `src/pages/OnboardingPage.jsx`: five-step flow, validation, persistence, progress, retry/session handling.
- `src/components/OnboardingPriorities.jsx`: meaningful academic profile and goal shortcuts.
- `src/components/Dashboard.jsx`: includes priorities.
- `src/components/timetable/ClassScheduleForm.jsx`: accessible association for course-selection errors.
- `src/auth/ProtectedRoute.jsx`: onboarding-aware route gates.
- `src/App.jsx`: protected `/onboarding` route.
- `src/styles/style.css`: responsive styles using existing design tokens.
- `tests/onboarding.spec.js`: nine browser tests.
- `playwright.config.js`: local browser test server/configuration.
- `package.json`, `package-lock.json`: Playwright development dependency and test command.
- `.gitignore`: excludes generated browser reports.

Root: `ONBOARDING_IMPLEMENTATION_REPORT.md`.

## Prisma/database changes and existing users

User fields added:

| Field | New-user default | Purpose |
| --- | --- | --- |
| onboardingCompleted | false | Authoritative routing state |
| onboardingCompletedAt | null | Actual successful completion time |
| onboardingDraft | {} | Recoverable partial setup |
| onboardingRevision | 0 | Prevent stale tabs overwriting newer setup |
| academicProfile | {} | Academic context and useful dashboard priorities |

The migration adds `onboardingCompleted` with a temporary default of true, preserving existing rows, then changes the default to false for subsequent inserts within the same transaction. Existing accounts are not assigned fabricated completion timestamps. Existing academic records are unchanged.

A real pre-migration account was inserted before applying the migration. Assertions verified that it stayed complete, its completion timestamp remained null, and a subsequent account started incomplete. All five migrations applied successfully and Prisma reported no schema drift.

Deployment order: apply `npm run prisma:migrate:deploy` using the production migration role, generate the Prisma client/build the API, deploy the API, then deploy the frontend. Preserve the existing Vite API URL, allowed frontend origin, secure cookie configuration, and Vercel SPA rewrite. The new frontend depends on the updated API/schema.

## API changes

All new endpoints use existing cookie authentication and origin protections:

- `GET /api/onboarding`: current user's draft, revision, and completion flag.
- `PATCH /api/onboarding`: `{ revision, draft }`; saves only if incomplete and revision matches; returns the next revision.
- `POST /api/onboarding/complete`: `{ revision }`; materializes the saved setup atomically and returns the safe User. Repeating successful completion preserves the original timestamp and creates no additional records.

Registration, login, `/api/auth/me`, and existing safe profile responses include completion state and academic profile. Drafts are only returned by the onboarding endpoint. New endpoints set `Cache-Control: no-store`.

## Routing behavior

- Logged out: existing login/register flow.
- Authenticated and incomplete: protected app URLs redirect to `/onboarding`.
- Authenticated and complete: normal app access; `/onboarding` redirects to `/app`.
- Authentication loading retains the existing loading screen; dashboard content does not mount before the gate resolves.
- Refresh restores status from the API and resumes the saved step.
- Redirects replace browser history entries. Existing catch-all routing and Vercel SPA fallback remain intact.

## Validation/security protections

Identity always comes from `request.auth.userId`; client user IDs and unknown properties are rejected. Draft class references must belong to courses in that user's submitted setup and are mapped to server-created course IDs during completion. Completion never uses client-selected persistent record IDs.

Inputs have string/array bounds, normalized course codes, validated UUIDs/colors/times/days, unique course codes, allowed goal values, valid time ranges, and overlap checks. Onboarding allows at most 20 initial courses and 60 initial classes. Existing general course APIs continue allowing duplicate codes as before.

Save conflicts return 409 and require reloading the saved draft. The UI retains failed input, disables controls during requests, synchronously locks repeated submissions, explains slow saves, and bounds each onboarding request to 30 seconds. Expired sessions offer sign-in. Uncertain save outcomes can be recovered by reloading server state without creating duplicate records.

## Tests added

Five validation tests cover optional setup, normalization/duplicates, foreign course references, invalid times and overlaps, forbidden identity/state inputs, bounded fields, and goal values.

Real API/database integration covers new registration, auth restoration, anonymous access, tenant isolation, revision conflicts, normalized draft persistence, simultaneous completion, timestamp idempotence, course/timetable materialization, login persistence, completion immutability, skipped setup, and transactional rollback after a schedule conflict.

Nine browser tests cover direct-route gates, saved-step refresh, existing/completed account routing, full course/timetable/goals completion at 320/390/768/1280px, horizontal overflow, duplicate course feedback, invalid time feedback, optional steps, API failures, expired sessions, logged-out routing, repeated clicks, and the auth loading gate.

The existing planner/auth and academic/profile integration suites also pass.

## Commands executed and results

Frontend, from `student-planner-react/`:

| Command | Result |
| --- | --- |
| `npm install --save-dev @playwright/test` | Passed; audit reported 0 vulnerabilities |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run test:browser` | 9 passed |

Backend, from `student-planner-api/`:

| Command | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm test` | Passed |
| `node tests/onboarding.test.js` | 5 tests passed |
| `npm run prisma:validate` | Passed |
| `npm run prisma:generate` | Passed |
| `DATABASE_URL=postgresql://taj@127.0.0.1:55439/onboarding_test bash scripts/verify-onboarding-migration.sh` | Passed |
| `prisma migrate deploy` through the rehearsal | All migrations applied |
| `prisma migrate status` through the rehearsal | Up to date |
| `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code` | No difference |
| `DATABASE_URL=postgresql://taj@127.0.0.1:55439/onboarding_test npm run verify:onboarding` | Passed, including concurrent retries and rollback |
| `DATABASE_URL=postgresql://taj@127.0.0.1:55439/onboarding_test npm run verify:integration` | Passed |
| `DATABASE_URL=postgresql://taj@127.0.0.1:55439/onboarding_test npm run verify:academic` | Passed |
| `node --check src/modules/onboarding/onboarding.routes.js` after final concurrency fix | Passed |

Root: `git diff --check` passed.

Local server/browser/database execution required sandbox escalation. All database verification used an isolated PostgreSQL cluster in `/tmp` and the disposable `onboarding_test` database. No existing development or production database was migrated.

Initial browser mock routing intercepted frontend modules; the mock was narrowed to the backend origin. A stricter concurrency test exposed PostgreSQL raw-query serialization errors; retry handling was corrected. Both suites passed afterward.

## Known limitations

- Draft persistence is explicit: adding/removing records and navigating steps saves. Unsubmitted typing since the last save is not recovered after refresh; the UI explains this.
- Browser tests mock API responses; API integration tests use real Express/Prisma/PostgreSQL separately. A connected browser-to-staging end-to-end run remains part of manual QA.
- Browser automation used desktop Chrome with mobile/tablet viewports. Safari, Firefox, physical devices, and screen-reader behavior need manual QA.
- Academic profile/goal preferences are shown on the dashboard but do not yet have a post-onboarding editing screen. Courses and classes remain editable through existing pages.
- The deployment itself, production migration lock duration, and hosted cookie/CORS behavior were not exercised locally.
- The browser configuration defaults to `/usr/bin/google-chrome`; use `PLAYWRIGHT_EXECUTABLE_PATH` for another installed Chromium-compatible executable.

## Manual QA checklist

- [ ] In staging, register a fresh account and verify onboarding appears immediately without dashboard flashing.
- [ ] Sign in with a migrated existing account and verify normal planner/profile/academic access.
- [ ] Add several courses, lecturer/color details, semester/year and optional program/study year.
- [ ] Add weekly classes across multiple days; verify room display, overlap errors, and end-before-start errors.
- [ ] Remove a draft course and verify its draft classes are removed with it.
- [ ] Refresh after each saved step, sign out/in, and resume from another device.
- [ ] Open two tabs, save in both, and verify a stale tab cannot overwrite newer data.
- [ ] Simulate a slow/disconnected backend and expired session; recover the saved setup.
- [ ] Finish, refresh, use browser back/forward, and navigate directly to `/onboarding`; verify dashboard access and no duplicated courses/classes.
- [ ] Skip all optional setup and verify a usable dashboard with zero setup records.
- [ ] Verify goal shortcuts, task quick-add, and academic context on the dashboard.
- [ ] Check keyboard-only navigation, focus, error announcements, touch targets, and real iOS/Android layouts.
- [ ] Verify hosted direct-route fallback, cookies/CORS, and the ordered deployment sequence.

Final decision: **READY FOR QA**. All required local checks passed; staging and manual checks above are the remaining QA activities.
