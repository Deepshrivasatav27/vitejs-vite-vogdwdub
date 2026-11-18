# CODEVEX — automatic email confirmation after Super Admin approval

## What this change does
- After the existing `company-admin-action` function successfully approves a company, the frontend calls `confirm-approved-company-users`.
- The new Edge Function verifies the caller's session and checks that the caller exists in `platform_admins`.
- It only confirms Auth emails for profiles belonging to that company whose `approval_status` is already `approved`.
- It does not expose the Supabase service-role key in browser code.

## Required deployment (must be done once in Supabase)
1. In Supabase Dashboard, open **Edge Functions** and create a function named exactly `confirm-approved-company-users`.
2. Upload/paste the contents of `supabase/functions/confirm-approved-company-users/index.ts` as that function's `index.ts`.
3. In **Project Settings → Edge Functions → Secrets** (or the function secrets screen), ensure these secrets exist:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — use the project service-role/secret key, only in Edge Function secrets. Never put it in Vite `.env`, React, GitHub, or browser storage.
4. Deploy the function.
5. In the app, sign in as Super Admin and approve a company. The app then confirms Auth email addresses for users in that company whose `profiles.approval_status = 'approved'`.

## Important limits
- This does not approve a pending profile. A profile must separately have `approval_status = 'approved'` before its email is confirmed. This prevents approving every agent in a company merely because the company was approved.
- If the user's profile is still pending, approve that profile through the intended user-approval workflow first.
- Existing users can be processed by running the company approval action again only if the existing `company-admin-action` function permits re-approval; otherwise a dedicated Super Admin action is needed.
- The Edge Function cannot work until it is deployed and the service-role secret is configured. The frontend source alone cannot change Supabase Auth users securely.
