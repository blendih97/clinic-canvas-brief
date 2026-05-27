The account `info@greenbears.co.uk` is correctly marked as an admin in the database, so the redirect to `/app` is most likely caused by the frontend admin guard checking access before the current session/role result has settled, or by a stale auth/session state in the preview.

Plan:

1. Improve the admin route guard
- Keep the loading screen until both auth and admin access are definitely resolved.
- Only redirect to `/app` after a confirmed non-admin result, not during an uncertain state.
- Add a clearer fallback message for signed-in users who are not admins instead of silently bouncing them.

2. Make admin role checking more robust
- Update the admin access hook so it resets cleanly when the signed-in user changes.
- Guard against stale role-check responses from a previous session.
- Treat role-check errors separately from “not admin”, so temporary backend/session issues do not instantly redirect.

3. Preserve security
- Continue using the secure `user_roles` table and `has_role` backend function.
- Do not use localStorage, hardcoded emails, or client-side admin bypasses.

Technical details:
- Files likely affected: `src/hooks/useAdminAccess.ts`, `src/App.tsx`.
- No database change is needed because the admin role already exists for `info@greenbears.co.uk`.