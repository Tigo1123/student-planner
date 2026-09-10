# Login recovery link: production diagnosis

Inspected 2026-09-10 at https://student-planner-web-v2.onrender.com/login.

## Root cause

Production serves `/assets/index-D8iUGmJ2.js`. Downloaded HTML and JavaScript plus real Chrome DOM inspection confirm that this bundle contains neither the recovery link nor the `/forgot-password` route. The link is absent from the DOM, not hidden by CSS. Direct navigation to `/forgot-password` renders the older catch-all behavior and returns to `/login`.

The working directory already has the correct component, styling and public recovery page. Those recovery changes remain uncommitted/untracked. Local HEAD is `24afd8d` (onboarding), whose LoginPage lacks the recovery link. The deployed login implementation matches that older login implementation; Render's exact deployed Git SHA was not available to inspect.

This is an outdated deployed application, not a duplicate component, conditional-rendering bug, or local browser cache assumption. A fresh independent Chrome context fetched the old production bundle.

## Actual application trace

`student-planner-react/index.html` → `src/main.jsx` → `src/App.jsx` → `/login` → `src/pages/LoginPage.jsx`.

Only one Login component and one explicit login route were found. The repository-root legacy `index.html` and `script.js` are not the Vite application entry point. The production HTML and login form confirm that the React application is deployed.

The working-tree LoginPage renders its unconditional recovery Link immediately after Password and before the error/button. It has `/forgot-password`, an aria-label, teal styling, right alignment, underline, and focus styling. The working-tree App mounts ForgotPasswordPage publicly, outside authenticated and logged-out-only guards.

Reviewed auth selectors, responsive rules, opacity, overflow and stacking rules. No rule hides the current recovery link; computed styles and real layout assertions pass on the built artifact.

## Rendered verification

The new script loads actual HTML, JavaScript and CSS from the supplied frontend URL. Only `/api/auth/me` is stubbed as logged out, so no production credentials or state are needed. It does not replace the frontend components or routes.

| Target | Widths | Result |
| --- | --- | --- |
| Live Render `/assets/index-D8iUGmJ2.js` | 320, 390, 1280 | FAIL: zero recovery anchors; forgot URL returns to Login |
| Fresh `dist` served by Vite preview, `/assets/index-D_A-3gce.js` | 320, 390, 1280 | PASS |

Passing checks: visible DOM link, below password, above validation error, right alignment, teal computed color, full opacity/visibility, no horizontal overflow, keyboard Tab/Enter, mouse click, public recovery page and refresh.

Frontend lint and production build pass. No additional login/authentication/layout edits were needed in this investigation.

## Exact files added in this investigation

- `student-planner-react/scripts/verify-login-link.mjs` — repeatable verification against a local build or deployed frontend.
- `LOGIN_LINK_DIAGNOSIS.md` — this evidence and handoff.

Earlier workspace changes in LoginPage, styles, App, ForgotPasswordPage and the recovery API are retained unchanged. They are not part of the currently deployed bundle.

## Required deployment step

Commit/push the reviewed recovery implementation, including its currently untracked page/component files, to Render's configured deployment branch. Deploy the matching recovery backend/migration/email configuration following PASSWORD_RECOVERY_IMPLEMENTATION_REPORT.md, then deploy the frontend with:

- Root directory: `student-planner-react`
- Build: `npm run build`
- Publish: `dist`
- Existing correct `VITE_API_URL`
- SPA rewrite: `/*` → `/index.html`, preserving query parameters

Deploying the existing committed HEAD again will not include the recovery changes. No Render deployment was triggered in this investigation; authenticated Render deployment access is not available here.

After deployment, run from `student-planner-react`:

```sh
node scripts/verify-login-link.mjs https://student-planner-web-v2.onrender.com
```

The script exits nonzero if the served application lacks the visible link or public recovery page. It uses installed Google Chrome; override PLAYWRIGHT_EXECUTABLE_PATH if needed.

**NOT READY FOR QA on production:** the fresh local production build passes, but the deployed application still lacks the feature. Mark the live fix ready only after deploying and passing the same mobile/desktop verification against Render.
