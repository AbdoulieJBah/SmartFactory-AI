# Restricted portfolio demo — release guide

## Scope
This release isolates a synthetic Viewer demo, removes embedded administrator credentials, restricts direct company-account assignment to Super Admin, and adds deployment checks. It does not complete the later inventory-concurrency, company-scoped audit, invitation, or disaster-recovery milestones.

## Verified locally
- 101 backend tests pass using isolated SQLite databases.
- All 55 mounted business write routes reject Viewer requests with HTTP 403 and unchanged database contents.
- A Viewer signs in, reads synthetic products/inventory/dashboard/reports, and cannot access global audit data.
- Demo provisioning is repeatable without duplicating business records; it refuses existing elevated accounts and additional memberships.
- Account-password rotation preserves the role and data. Existing tokens require signing-key rotation for revocation.
- Registration can be disabled, arbitrary Vercel origins are rejected, trusted origins are accepted, and health errors hide connection details.
- TypeScript, ESLint and the Next.js production build pass.
- Browser checks cover demo login, 18 read pages, hidden editing controls, six restricted pages and expired-session recovery.

## Deployment order
1. Record the currently deployed frontend/backend revisions and take a provider database backup. Verify the backup exists before making account changes. This release has no database schema migration.
2. Deploy the backend release with a fresh, unique random `SECRET_KEY` (at least 32 characters). Do not reuse the documented development examples. Rotating it invalidates all old access tokens; users must sign in again.
3. Set `ALLOW_REGISTRATION=false` for the public demo. Set `CORS_ORIGINS` to the exact trusted frontend URL(s), separated by commas. Preview origins must be explicitly listed. Keep database and Gemini credentials server-side.
4. Check `GET /health` returns HTTP 200 and `{"status":"ok"}`. A database failure returns 503 without connection details.
5. In the deployed backend shell, from the directory containing `demo_admin.py`, rotate the formerly public administrator password:

   ```sh
   python demo_admin.py rotate-password --email admin@smartfactory.ai
   ```

   Enter a new private password at the hidden prompt and store it in your password manager. Never paste it into a public build variable. The script does not print passwords.
6. Provision a **new** Viewer email for the demo:

   ```sh
   python demo_admin.py provision-demo --email YOUR_DEMO_EMAIL
   ```

   Enter a separate password, at least 16 characters and no more than 72 UTF-8 bytes. Provisioning creates a separate company named `SmartFactory Portfolio Demo (Synthetic)` with synthetic products, inventory, production logs, checks, waste and downtime. It does not modify other companies. Do not run the legacy `seed_demo_data.py` on production: that script assumes company ID 1.
7. Verify the demo account returns `Viewer` from `/users/me`, sees only its synthetic products, and receives 403 on a product-create attempt. Confirm the old administrator password no longer works and an old token is rejected. The new administrator password must still work.
8. Deploy the frontend with `NEXT_PUBLIC_API_URL` pointing to the verified backend. Set `NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD` only to the new Viewer account. These two values are intentionally public browser-bundle content, never administrator credentials. They are read at build time, so changing them requires a frontend rebuild. Without them, the demo button is absent and normal login remains available.
9. From a fresh browser session, click **Explore read-only demo**. Confirm the synthetic company title, Products and Inventory rows, Reports, hidden create/edit/delete controls, and blocked `/users`, `/companies`, `/audit-logs`, `/ai`, `/scheduling` and `/register` pages. Check logout and sign-in again.
10. Only after these checks pass, restore the portfolio's live-demo link. No AI API calls are available to the public Viewer account.

## Rollback
- Before enabling public access, a failed health or permission check means stop and keep demo access unpublished.
- Roll back code only to a reviewed safe revision. Do **not** restore the old public administrator credentials, old signing key or wildcard CORS configuration. The prior frontend contains public admin defaults and is not a safe public fallback.
- The release adds one synthetic tenant and Viewer account; there is no schema migration to reverse. Disable public access by clearing the two public demo build variables and redeploying the frontend. Rotate the Viewer password and signing key if the account must be revoked.
- Provider database backup restoration must be tested against a separate non-production database before it is used for recovery. Restoration has not been exercised in this local release.

## Reproducing browser checks locally
Install backend development dependencies and frontend dependencies from the lockfile. Use a **disposable local database**, never production. Set `DATABASE_URL` to it and a valid `SECRET_KEY`, create tables, and call `provision_demo` with a test-only Viewer email/password. Run the backend on `127.0.0.1:8100` with `ALLOW_REGISTRATION=false` and `CORS_ORIGINS=http://127.0.0.1:3100`.

Build the frontend with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8100` and the matching test-only demo email/password. Start it on port 3100. Then:

```sh
npx playwright install chromium
npm run test:demo
```

The script refuses non-local frontend URLs. `SMOKE_CHROME_PATH` optionally selects an installed Chrome executable. Screenshots go to `/tmp/smartfactory-smoke`, or `SMOKE_OUTPUT` if set. Local build output is not a production deployment artifact; production must rebuild with its actual backend URL.

## Known boundaries
- Local backend/browser checks used SQLite, not production PostgreSQL. They do not prove concurrency, production networking or provider recovery.
- Existing backend dependency deprecation warnings and Next.js's middleware-to-proxy warning remain; they did not fail checks.
- Direct account assignment is a platform-admin operation until an invitation/acceptance flow is implemented. Global audit remains Super Admin-only until company ownership is stored on audit events.
- Existing OEE and forecasting displays use simplified demonstration formulas; this release does not validate them as industrial performance or predictive models. The dashboard now uses the same OEE endpoint as the dedicated page and labels its fixed 480-minute assumption. Treat this as a demonstration metric pending a model based on scheduled production exposure. Production charts use loaded records; the nonfunctional date selector and fallback sample trend were removed.
- The demo includes representative synthetic production/inventory data; not every optional business module has seeded records.
