# PASSWORD RECOVERY IMPLEMENTATION REPORT

Final decision: **READY FOR QA**

Implemented and verified locally on 2026-09-10. No production database, deployment, credentials, or live email account was changed.

## Existing auth architecture

Express uses JWTs in seven-day HttpOnly cookies with issuer/audience verification, bcrypt at 12 rounds, strict Zod input validation, existing origin protection and auth rate limits. React restores authentication from `/api/auth/me` and uses public/protected/onboarding route gates. Registration already had confirmation; there was no change-password form or email infrastructure.

Existing cookie settings, registration/login semantics, and onboarding route gates remain intact. A session-version check was added to authenticated requests to support password-reset revocation.

## Files changed

Backend paths relative to `student-planner-api/`:

- `prisma/schema.prisma`
- `prisma/migrations/20260910000000_add_password_recovery/migration.sql` — new
- `src/config/env.js`
- `src/middleware/auth.js`
- `src/middleware/rateLimit.js`
- `src/modules/auth/auth.validation.js`
- `src/modules/auth/auth.service.js`
- `src/modules/auth/auth.controller.js`
- `src/modules/auth/auth.routes.js`
- `src/modules/auth/passwordRecovery.service.js` — new
- `src/modules/auth/passwordRecovery.controller.js` — new
- `src/services/email.js` — new
- `tests/passwordRecovery.test.js` — new
- `scripts/password-recovery-integration-check.js` — new
- `scripts/verify-password-recovery-migration.sh` — new
- `package.json`, `.env.example`, `README.md`

Frontend paths relative to `student-planner-react/`:

- `src/components/PasswordInput.jsx` — new
- `src/pages/ForgotPasswordPage.jsx` — new
- `src/pages/ResetPasswordPage.jsx` — new
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx`
- `src/auth/authApi.js`
- `src/App.jsx`
- `src/styles/style.css`
- `index.html`
- `tests/passwordRecovery.spec.js` — new
- `README.md`

Root: this report. No runtime dependencies were added.

## Database changes

Three fields on User fit the existing architecture and allow one active reset token per account:

| Field | Default | Purpose |
| --- | --- | --- |
| resetPasswordTokenHash | null | Unique SHA-256 hash; raw token is never persisted |
| resetPasswordExpiresAt | null | Expiry timestamp |
| sessionVersion | 0 | Revoke all older JWTs after a reset |

The additive migration preserves existing rows and password hashes. A disposable database rehearsal applied all prior migrations, inserted an existing-account fixture, applied this migration, and verified unchanged password/onboarding data, null token fields, and version zero. Prisma reported no schema drift.

## API endpoints

`POST /api/auth/forgot-password`

Request: `{ "email": "student@example.com" }`

Valid accepted requests return HTTP 200 with:

> If an account exists for this email, a password reset link has been sent.

The same public response is returned for existing accounts, nonexistent accounts, provider failures, and per-email throttling. Invalid email syntax produces validation feedback; IP throttling produces a generic 429. Infrastructure failures use the existing sanitized error handler.

`POST /api/auth/reset-password`

Request: `{ "token": "...", "password": "...", "confirmPassword": "..." }`

Successful reset clears the current cookie and returns a confirmation message. Invalid, expired, replaced, or used tokens are rejected. No token hash, password hash, internal session version, or sensitive user data is returned.

## Password visibility implementation

A shared controlled `PasswordInput` renders an inline SVG eye/eye-off button attached to its input. Each input manages visibility independently and preserves its value. Buttons use `type="button"`, descriptive Show/Hide labels, `aria-pressed`, `aria-controls`, visible focus, and a 44px target.

Applied to login password, registration password and confirmation, and reset password and confirmation. No existing change-password form was found.

## Email implementation/provider

A small injectable email service uses Resend's HTTPS API. Auth logic creates the message and invokes the abstraction; a future provider can replace the transport without rewriting token handling. Templates include Student Planner branding, a Reset Password button, plain-text link, 20-minute expiry notice, and ignore-if-unrequested guidance.

The trusted reset origin comes from `FRONTEND_ORIGIN`, never the request Host header. Production requires HTTPS and configured email delivery. Development defaults to disabled delivery and never prints tokens or reset URLs. Provider calls time out after four seconds. Delivery failures log only a fixed operational warning and revoke that request's hash, without deleting a newer concurrently issued token.

The adapter follows the [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email). Live sending requires a verified sender and API key; all automated provider calls were intercepted in memory.

## Token security strategy and sessions

Each token is generated with `crypto.randomBytes(32)` and encoded as 64 hex characters. Only its SHA-256 hash and expiry are stored. It expires after 20 minutes. New accepted requests replace the previous active token.

Reset checks the hash/expiry, computes the existing bcrypt hash, then atomically updates only a row that still has that active hash and has not expired. That same update clears the reset fields and increments the session version. Concurrent token consumption therefore has exactly one winner.

JWTs now contain an internal `ver` claim. Middleware compares it against the current database version. Existing JWTs without that claim are treated as version zero, preserving sessions through rollout. After reset, older sessions fail authentication on subsequent requests; other users' sessions remain valid. New login uses the current version. Already-running requests are not cancelled.

Normal forgot responses have a five-second minimum duration to mask ordinary provider timing, including nonexistent accounts. The frontend bounds recovery requests to 15 seconds. These choices follow the consistent-response, random-token, expiry, single-use and referrer-protection guidance in the [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## Rate limiting

- Forgot: five requests per IP per 15 minutes.
- Forgot: three requests per normalized email per 15 minutes, including nonexistent addresses. Store keys hash the email; throttled email responses remain neutral and wait the same minimum duration.
- Reset: fifteen attempts per IP per 15 minutes.

These reuse express-rate-limit and its existing process-local storage pattern. A shared store is needed for consistent limits across multiple API instances.

## Validation and error handling

Registration and reset share the same Zod password schema: 8–128 characters. Password hashing uses the same exported bcrypt helper and 12 rounds. Confirmation must match exactly; passwords are not trimmed. Token syntax is strictly 64 lowercase hex characters. Email normalization reuses the existing schema. Unknown request properties are rejected.

The UI handles invalid emails, mismatched passwords, weak passwords, malformed/missing links, expired/used links, backend outages, slow requests, and duplicate submission. A synchronous submission lock and disabled controls prevent repeated clicks. API errors retain entered fields. Provider errors and internal stacks are not exposed. Passwords and tokens are not logged by the new code.

## Frontend pages/components and routing

Both pages reuse AuthLayout, existing illustration, deep teal/warm orange/cream tokens, form styles and responsive behavior. Login links to Forgot Password. Reset shows guidance and invalid-link recovery; successful reset replaces the token URL with `/login` and displays a success message.

`/forgot-password` and `/reset-password` are public routes outside the logged-out-only gate, so email links also work when another session exists. Existing protected and onboarding routing remains unchanged.

The existing Render `/*` → `/index.html` rewrite must remain a rewrite and preserve query parameters. README instructions explicitly include both recovery URLs. The document's `no-referrer` meta policy prevents reset URLs leaking as outgoing referrers. Successful reset removes the token from the current history entry; while unfinished, the URL remains available for refresh.

## Tests executed and results

| Command | Result |
| --- | --- |
| Frontend `npm run lint` | Passed |
| Frontend `npm run build` | Passed |
| Frontend `npm run test:browser` | 18 passed: 9 recovery and 9 existing onboarding tests |
| Backend `npm run check` | Passed |
| Backend `npm test` | Both test files passed |
| Backend `node tests/passwordRecovery.test.js` | 4 tests passed |
| Backend `npm run prisma:validate` | Passed |
| Backend `npm run prisma:generate` | Passed |
| Backend `npm run prisma:migrate:deploy` on disposable DB | Passed |
| Backend `prisma migrate status` | Up to date |
| Backend `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code` | No difference |
| `bash scripts/verify-password-recovery-migration.sh` with its guarded disposable URL | Passed existing-user preservation checks |
| Backend `npm run verify:password-recovery` | Passed |
| Backend `npm run verify:integration` | Passed |
| Backend `npm run verify:academic` | Passed |
| Backend `npm run verify:onboarding` | Passed |
| Root `git diff --check` | Passed |

API suites used `DATABASE_URL=postgresql://taj@127.0.0.1:55439/onboarding_test`; migration rehearsal used the separate disposable `recovery_migration_test` database. Local database/server/browser access required sandbox escalation. No existing development or production database was touched.

Recovery integration asserts identical known/unknown/provider-failure responses, SHA-256 storage, absence of raw tokens, expiry bounds, password/confirmation validation, malformed/invalid/expired/replaced/used tokens, successful reset, concurrent single-use enforcement, new-password login, old-password rejection, current and legacy session revocation, isolation of another account, and IP/email throttling.

Browser tests cover login navigation, keyboard visibility toggles on all relevant fields, independent confirmation toggles, refresh/direct reset links, success handoff, malformed/expired states, email validation, duplicate presses, network errors, slow requests, and reset layouts at 320/768/1280px without overflow.

## Environment variables required

| Variable | Purpose |
| --- | --- |
| EMAIL_PROVIDER=resend | Enable real email; required in production |
| EMAIL_FROM | Bare email address on a verified sender domain |
| RESEND_API_KEY | Provider credential stored in hosting secrets |
| FRONTEND_ORIGIN | Trusted exact frontend origin, also used for reset links |
| VITE_API_URL | Existing frontend setting pointing to the API |
| DATABASE_URL, JWT_SECRET, NODE_ENV | Existing API configuration |

Existing production avatar configuration is still required. No secret values or actual `.env` files were modified. For local development, configure a verified test sender and a localhost FRONTEND_ORIGIN if live reset emails are desired; disabled delivery is intentionally not a token-printing shortcut.

## Production deployment steps

1. Verify a sender domain with Resend and set EMAIL_PROVIDER, EMAIL_FROM and RESEND_API_KEY in Render's secret environment. Set FRONTEND_ORIGIN to the actual frontend HTTPS origin, for example the existing Student Planner Render static site.
2. Apply the additive migration through the production migration role using `npm run prisma:migrate:deploy`.
3. Generate Prisma/build and deploy all API instances. Production startup fails clearly if email is missing. Complete the API rollout before relying on session revocation, since old instances do not check versions.
4. Build/deploy the frontend with its existing VITE_API_URL. Preserve Render's SPA rewrite and query parameters.
5. Run the staging/manual checks below, verify provider delivery, and monitor sanitized failure warnings. Do not log reset query parameters or request bodies in external analytics/proxies.

## Known limitations

- Live Resend delivery, DNS/sender verification, inbox placement, and hosted Render configuration were not exercised; real credentials were not supplied.
- Email delivery is bounded but has no durable retry queue. Failed requests are safely revocable and users can request another link. An ambiguous timeout may leave a delivered but revoked link; the UI provides recovery.
- The response floor masks ordinary email timing, not arbitrary prolonged database outages or event-loop stalls.
- Rate limits are process-local, as in the existing app. Configure a shared store when scaling horizontally.
- Bcrypt's existing 72-byte truncation behavior is unchanged; the requested existing 8–128-character policy is reused rather than migrating the password algorithm in this change.
- Browser tests use mocked APIs; separate API integration uses real Express/Prisma/PostgreSQL. A connected staging email-to-browser run remains manual QA. Chrome mobile viewports were tested; Safari/Firefox, physical devices and screen readers remain manual checks.
- External access logs or analytics could capture an incoming reset URL unless configured to redact its query. New application code does not log it, and the document prevents referrer leakage.

## Manual QA checklist

- [ ] Verify real reset email branding, sender, links, plain-text fallback and inbox/spam delivery in staging.
- [ ] Compare neutral responses for known and unknown addresses; check invalid email and rate limits.
- [ ] Toggle every password/confirmation field with mouse, touch, Tab and Enter; verify values are unchanged.
- [ ] Open a reset email directly, refresh the page, and reset with valid matching passwords.
- [ ] Confirm login success text and new-password login; verify the old password fails.
- [ ] Try expired, malformed, replaced and already-used links; verify new-link guidance.
- [ ] Confirm existing sessions on another device are rejected after reset and other accounts stay signed in.
- [ ] Simulate slow/unavailable API and email provider failure; inspect sanitized server logs and retry recovery.
- [ ] Verify email links while logged in, production SPA fallback, cookie/CORS behavior, and actual deployed API origin.
- [ ] Check 320px mobile, tablet and desktop layouts, Safari/Firefox, keyboard focus and screen-reader labels.
- [ ] Confirm proxy/error-monitoring/analytics configuration excludes reset tokens and password request bodies.

Final decision: **READY FOR QA**. All required local checks pass; live delivery and staging/device checks remain the QA handoff.
