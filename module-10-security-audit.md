# Module 10 — Security & Production Audit

Read-only audit. No code was modified. Scope: authentication, authorization, role security, RLS, RPCs, storage, Server Actions, Route Handlers, input validation, data exposure, secrets, dependencies, concurrency, error handling, maintenance mode, security headers, abuse protection.

## Important scope limitation

This repository has no `supabase/migrations` folder and no `.sql` files anywhere in version control (confirmed via a full-repo search). Every RLS policy, `SECURITY DEFINER` RPC, storage policy, and trigger referenced by the application code (`submit_borrow_request`, `approve_borrow_request`, `complete_return`, `report_damage`, `cancel_borrow_request`, `get_public_instrument_by_code`, and whatever `updated_at` triggers exist) lives only in the live Supabase project. I could read and verify every line of application code, but I could not read the actual policy/function definitions — I only have the code's *comments* describing what they're supposed to do.

That gap is itself a finding (see H-1). Everywhere below marked **[UNVERIFIED]** means: the application code is written as if the database enforces something, and that's a reasonable assumption given the coding patterns in this repo, but it could not be confirmed from the codebase and should be checked directly in the Supabase SQL editor before this is considered production-ready.

---

## CRITICAL

### C-1. `profiles.role` self-escalation — [UNVERIFIED, must check today]
**Affected:** `profiles` table RLS UPDATE policy.
**Problem:** Every authorization check in this app (`requireAdmin()`, `assertAdmin()` in every Server Action, every Route Handler) trusts `profiles.role` read from the database. Nothing in the application code can prevent a member from setting their own `role` — that protection has to live in the database. `app/profile/actions.ts` (`updateProfile`) only ever writes `full_name`/`phone`/`avatar_url` and scopes its `UPDATE` to `.eq("id", user.id)`, which is correct — but that's the *app's* query. Any authenticated member can also call `supabase.from('profiles').update({role:'admin'}).eq('id', <own id>)` directly from a browser console using their own session token, entirely bypassing this app. There is no admin-management UI in this codebase at all (`/admin/members` is linked from the nav but the route doesn't exist), so today the *only* thing standing between "member" and "admin" is whatever the `profiles` UPDATE policy's `WITH CHECK` clause enforces.
**Realistic impact:** If the UPDATE policy doesn't pin `role` (e.g. `WITH CHECK (role = (select role from profiles where id = auth.uid()))`), any signed-up member can make themselves admin and gain every admin capability in the app — manage instruments, approve/reject borrow requests, edit site settings, export member data.
**Fix:** In the Supabase SQL editor, confirm the `profiles` UPDATE policy's `WITH CHECK` clause blocks `role` changes (or restrict `role`'s column-level UPDATE grant to a service-role-only path). If it doesn't, this is a same-day fix.

### C-2. `profiles` SELECT exposure to other members — [UNVERIFIED]
**Affected:** `profiles` table RLS SELECT policy.
**Problem:** The app never queries another member's `phone`/`full_name` on behalf of a member (only admin-scoped queries in `lib/supabase/borrow-requests.ts` join `profiles` for the requester's contact info). But if the SELECT policy is broader than "own row, or admin," a member could read every other member's phone number and full name directly via the client SDK.
**Realistic impact:** PII exposure (phone numbers) among the club's own membership — moderate real-world sensitivity, but a clear privacy violation and worth fixing before this scales past a small club.
**Fix:** Confirm the `profiles` SELECT policy is `USING (id = auth.uid() OR is_admin())`, not `USING (true)` for `authenticated`.

---

## HIGH

### H-1. No version-controlled database migrations
**Affected:** Whole project (no `supabase/` folder, no `.sql` files).
**Problem:** RLS policies, RPCs, storage policies and triggers exist only as live state in the Supabase dashboard. There's no diff history, no code review trail, and — as this audit shows — no way to fully verify security-critical logic without dashboard/CLI access. A policy can be "temporarily" loosened while debugging and never restored, with nothing in git to catch it.
**Realistic impact:** Every finding in this report that says [UNVERIFIED] exists because of this gap. It also means a future contributor can silently weaken RLS with no review.
**Fix:** Adopt the Supabase CLI (`supabase db pull` to capture current state, then `supabase/migrations` going forward). Not a code change to this app, but the single highest-leverage fix for this audit's blind spots.

### H-2. `/admin/*` authorization is page-level only, not defense-in-depth
**Affected:** `middleware.ts` / `lib/supabase/middleware.ts` (`PROTECTED_PREFIXES`), all 19 files under `app/admin/**/page.tsx`.
**Problem:** Middleware's `PROTECTED_PREFIXES` only checks *whether a session exists* for `/admin/*` — it does not check role. Every admin page currently does call `requireAdmin()` (verified all 19), and every admin Server Action/Route Handler does call its own `assertAdmin()`/role check (verified all 12 "use server" files + all 4 route handlers) — so there is no exploitable gap *today*. But this means the only thing preventing a signed-in member from reaching `/admin/*` is that every single file remembers to check. One new admin page that forgets `requireAdmin()` is silently exposed to any logged-in member, with no middleware backstop and no test that would catch it.
**Realistic impact:** Not currently exploitable, but it's a single-point-of-failure pattern across ~23 files with no shared enforcement.
**Fix:** Add a role check to `updateSession()` for `/admin/*` (reusing the `currentUserIsAdmin()` helper that already exists for maintenance mode) so an unauthorized member is redirected before the page even renders, independent of whether the page remembered its own check.

### H-3. Storage bucket write permissions for admin-only buckets — [UNVERIFIED]
**Affected:** `instrument-images`, `event-images`, `gallery-images`, `site-assets` buckets; `lib/supabase/storage.ts` (`uploadToPublicBucket`).
**Problem:** `uploadToPublicBucket()` uploads directly from the browser to the Supabase Storage REST API using the member's own session token, and only checks `if (!session) throw` — there is no role check anywhere in this function. The admin-only gating for these buckets (only admins should be populating instrument/event/gallery/site-asset images) happens entirely in the *separate* Server Action that later writes the database row (`assertAdmin()` in `app/admin/instruments/actions.ts` etc.) — not at upload time. If the storage bucket's own RLS/policy allows any `authenticated` role to `INSERT`, a regular member could upload arbitrary files directly to these buckets (via the REST API, bypassing the UI and its client-side MIME/size checks in `ImageUploadField.tsx`) even though they could never get that file attached to a real instrument/event row.
**Realistic impact:** Storage quota/cost abuse, hosting of unwanted or malicious files under the club's Supabase project domain (reputational risk, potential phishing hosting), and if MIME sniffing isn't locked down at the bucket level, a crafted upload could be served as `text/html`.
**Fix:** Confirm each bucket's storage policy restricts `INSERT`/`UPDATE`/`DELETE` to `is_admin()` (not just `authenticated`) for `instrument-images`, `event-images`, `gallery-images`, `site-assets`. `return-photos` and `avatars` are correctly member-scoped by design (per code comments) and are lower risk.

### H-4. Borrowing/return concurrency guarantees — [UNVERIFIED]
**Affected:** `submit_borrow_request`, `approve_borrow_request`, `reject_borrow_request`, `complete_return`, `cancel_borrow_request` RPCs (source not in repo); `app/admin/instruments/actions.ts` (`archiveInstrument`).
**Problem:** The application layer's own concurrency guard for archiving (`instrumentHasOpenBorrowRequest()` checked, then a separate `UPDATE`) is a classic check-then-act race — two nearly-simultaneous admin actions could both pass the check before either commits. This is very unlikely to matter for a small club with 1-2 admins acting manually, but it's worth naming. More importantly, I can't confirm from application code whether `approve_borrow_request` atomically guards against two pending requests for the same instrument both being approved (e.g. via `UPDATE instruments SET status='borrowed' WHERE id=... AND status='available'` inside the RPC, or row locking) — the RPC wrapper just forwards to `supabase.rpc(...)` and surfaces whatever error comes back.
**Realistic impact:** If unguarded, two admins approving two different pending requests for the same instrument in quick succession could both succeed, physically over-allocating one instrument to two borrowers.
**Fix:** Confirm each RPC performs its status transition as a single atomic `UPDATE ... WHERE status = 'available'` (or explicit row lock) and raises when zero rows are affected, rather than a `SELECT` check followed by a separate `UPDATE`.

### H-5. `sharp`/`next` image-pipeline CVEs reachable via member avatar uploads
**Affected:** `package.json` (`next@16.2.12`), `npm audit`.
**Problem:** `npm audit` reports 6 high-severity advisories. Four (`brace-expansion`, `js-yaml`, `nanoid`, and one of the `postcss` findings) are build/lint-tooling only and not reachable at runtime. But `sharp` (bundled transitively via `next`) processes every image `next/image` optimizes — including member-uploaded avatars (`app/profile/actions.ts`, any authenticated member can upload) — and has known libvips CVEs in the affected version range.
**Realistic impact:** A crafted image uploaded as an avatar could exercise a libvips vulnerability during optimization.
**Fix:** `npm install next@16.3.0` (non-major bump; `npm audit` shows this as the fix target for the `next`/`postcss`/`sharp` cluster). Re-run `npm audit` after. Do **not** run `npm audit fix --force` blindly — confirm 16.3.0 doesn't break anything first (I have not tested this).

---

## MEDIUM

### M-1. CSV injection via `full_name` in admin exports
**Affected:** `lib/csv.ts` (`toCsv`), `app/admin/reports/export/members/route.ts`, `app/admin/reports/export/borrowings/route.ts`.
**Problem:** `toCsv()` correctly escapes quotes/commas/newlines for CSV syntax, but doesn't defuse formula injection. `full_name` is member-editable (`app/profile/actions.ts`) and is included verbatim in both CSV exports. A member could set their name to `=HYPERLINK("http://evil.example","Click")` or similar; if an admin opens the exported file in Excel/Sheets, it can execute as a formula.
**Realistic impact:** Low-likelihood but classic CSV-injection pattern (OWASP-documented), targeting the admin who exports the report.
**Fix:** In `toCsv()`, prefix any cell whose first character is `=`, `+`, `-`, `@`, tab, or CR with a leading `'` before the existing quote-escaping.

### M-2. Middleware's protected-route list is incomplete
**Affected:** `lib/supabase/middleware.ts` (`PROTECTED_PREFIXES = ["/dashboard", "/profile", "/instruments", "/admin"]`).
**Problem:** `/announcements`, `/my-borrowings`, `/my-requests` are member-only per `CLAUDE.md` but aren't in this list. Verified each of those pages does its own `getCurrentUser()` + `redirect("/login")` check, so nothing is exposed today — but, same pattern as H-2, there's no middleware backstop if a future page under these paths forgets the check.
**Fix:** Add `/announcements`, `/my-borrowings`, `/my-requests` to `PROTECTED_PREFIXES`.

### M-3. Upload size/MIME limits rely on client-side JS + assumed bucket config — [PARTIALLY UNVERIFIED]
**Affected:** `components/ui/ImageUploadField.tsx`, `lib/supabase/storage.ts`.
**Problem:** Type/size checks for instrument and event images happen only in the browser (`ImageUploadField.tsx`); code comments assume Supabase bucket-level `file_size_limit`/`allowed_mime_types` back this up, but that's dashboard configuration I can't see from the repo.
**Fix:** Confirm every bucket (`instrument-images`, `event-images`, `gallery-images`, `site-assets`, `return-photos`, `avatars`) has explicit `file_size_limit` and `allowed_mime_types` set server-side in Supabase — don't rely on the client check alone.

### M-4. No security headers configured
**Affected:** `next.config.ts` (no `headers()` function at all).
**Problem:** No `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or clickjacking protection (`X-Frame-Options` / `frame-ancestors`) are set anywhere.
**Fix (recommend, not yet applied):**
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY` (or `frame-ancestors 'none'` via CSP) — nothing in this app needs to be iframed.
- **CSP: not recommending a specific policy yet, per your instruction.** This app loads Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`), talks to Supabase (`*.supabase.co` for API + Storage, both `https:` and the project's `wss:` if realtime is ever used), and Tailwind + Next's dev/inline styles need at least `'unsafe-inline'` for `style-src` unless nonces are wired through `next/font`'s existing setup. A CSP would need to be built and tested against all of that before enabling — happy to draft one as a separate step if you want it.

### M-5. No login rate limiting / brute-force protection beyond Supabase Auth defaults
**Affected:** `app/login/actions.ts`.
**Problem:** The action calls `signInWithPassword` directly with no additional throttling, lockout, or CAPTCHA. Supabase Auth has some built-in rate limiting, but it's project-wide defaults, not tuned for this app.
**Fix:** Enable/verify Supabase Auth's rate-limit and leaked-password-protection settings in the dashboard. Consider a short client-side cooldown after repeated failures as a UX nicety (not a real control on its own).

---

## LOW

### L-1. `/admin/members` is a dead link
**Affected:** `components/NavbarClient.tsx` (`ADMIN_MENU_ITEMS`), no corresponding `app/admin/members/` route exists.
**Problem:** Not a vulnerability, but notable given C-1/C-2: there is currently no in-app way to manage member roles at all — every role change happens outside this application entirely.
**Fix:** Either build the page or remove the nav link until it exists.

### L-2. Minor double-redirect during maintenance mode
**Affected:** `lib/supabase/middleware.ts`.
**Problem:** A logged-in *member* (not admin) visiting `/login` during maintenance gets redirected to `/dashboard` (already-authenticated rule), then immediately redirected again to `/maintenance` (maintenance gate) on the next request. Not a loop (it terminates), just an extra hop.
**Fix:** Cosmetic only — low priority.

### L-3. Contact form isn't wired to a backend yet
**Affected:** `components/ContactForm.tsx`.
**Problem:** Confirmed via its own comment — `setTimeout(...)` placeholder, "not yet connected to Supabase." No abuse surface exists today because nothing is actually submitted anywhere.
**Fix:** When this is wired up, add basic rate limiting (e.g. a Postgres unique/time-window constraint, or a Supabase Edge Function with IP throttling) before it goes live, since it will become the app's only unauthenticated public write path.

---

## Confirmed OK (no action needed)

- `middleware.ts` uses `supabase.auth.getUser()` (revalidates with Supabase), never `getSession()` — correct, avoids trusting a stale cookie.
- `.env.local` is covered by `.env*` in `.gitignore` — confirmed not tracked by git.
- No secret patterns (`service_role`, `sb_secret`, `SUPABASE_SECRET`, `SUPABASE_SERVICE`) found anywhere in tracked source.
- Only three `NEXT_PUBLIC_*` variables exist: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key — safe by design), and `NEXT_PUBLIC_SITE_URL` (a public domain string). None are secrets.
- `/i/[instrument_code]` (Module 9): logged-out visitors are served exclusively through `getPublicInstrumentByCode()`, which calls the restricted `get_public_instrument_by_code` RPC. I authored that RPC's SQL myself in Module 9 (`SECURITY DEFINER`, `SET search_path = public`, schema-qualified, `REVOKE ALL ... FROM PUBLIC` then `GRANT EXECUTE TO anon, authenticated`, regex-validates the code, excludes archived rows, returns no `id`/notes/purchase/borrowing data) — assuming it was applied exactly as given, this route cannot leak member emails, phone numbers, internal UUIDs, admin notes, borrowing history, return photos, or database errors. Authenticated members/admins go through a separate, normal RLS-gated query.
- Only one use of `dangerouslySetInnerHTML` in the whole codebase (`components/admin/instruments/InstrumentQrLabel.tsx`), rendering SVG markup generated server-side by the `qrcode` npm package from a regex-validated instrument code — no user string is ever interpolated into the SVG itself (the QR encoder only emits `<path>`/`<rect>` shapes). Safe.
- Every Server Action checked (12 files) re-verifies `user`/`profile.role` server-side independently of page-level gating — the `updateProfile`/`uploadAvatar` actions correctly scope all writes to `.eq("id", user.id)` and never accept a `role` field from the form.
- No raw `error.message` from Supabase/Postgres is returned to the client anywhere (grep confirmed) — every catch path returns a hand-written, generic message. RPC error messages that do reach the client (`describeRpcError()` in `app/instruments/[id]/actions.ts`) are developer-authored `RAISE EXCEPTION` text, not Postgres internals.
- Storage paths for uploads are built server/client-side from `crypto.randomUUID()` + a whitelisted extension, never from the raw filename — prevents path traversal via a crafted filename.
- `return-photos` bucket is private, accessed only via short-lived signed URLs (`lib/supabase/return-photos.ts`), scoped by request-id-prefixed paths per code comments.
- Static assets are excluded from all middleware gating via `middleware.ts`'s `config.matcher`.
- Maintenance mode: guest and member are both redirected to `/maintenance`; `/login` and `/admin` are gating-exempt so an admin can always sign in and reach the admin portal; the maintenance page itself is exempt (no redirect loop); settings-fetch failure fails open (site stays accessible) rather than locking everyone out.

---

## Fix-first list (my recommendation)

1. **C-1** — verify/fix the `profiles` UPDATE policy so `role` can't be self-changed. Same-day.
2. **C-2** — verify the `profiles` SELECT policy is scoped to own-row-or-admin.
3. **H-3** — verify storage bucket write policies are admin-only for `instrument-images`/`event-images`/`gallery-images`/`site-assets`.
4. **H-4** — verify the borrowing/return RPCs use atomic status-guarded updates.
5. **H-1** — start capturing the current Supabase schema/policies into version control (`supabase db pull`), so C-1/C-2/H-3/H-4 don't stay permanently unverifiable and future changes are reviewable.
6. **H-5** — bump `next` to 16.3.0, re-audit.
7. **H-2** and **M-2** — add a role check + the missing prefixes to middleware, as defense-in-depth (low-risk, mechanical change).
8. **M-1** — sanitize CSV export cells against formula injection.
9. Everything else (M-3 through L-3) — normal backlog priority.

Items 1–4 need direct Supabase dashboard/SQL-editor access, which I don't have — I can't perform or verify them myself. Everything else is a code change I can make once you approve.

No code has been changed. Waiting for your go-ahead on which of these to act on.
