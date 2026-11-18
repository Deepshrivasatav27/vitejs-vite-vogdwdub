# CODEVEX Frontend Audit — 18 November 2026

## Scope
The frontend is being completed before additional backend work. Existing Supabase-connected CRM and authentication code must be preserved. This audit is based on the uploaded source and the supplied Supabase policy export.

## Existing screens found
- Authentication and password-reset flows: `src/Auth.tsx`.
- Company CRM shell and data loading: `src/App.tsx`.
- Dashboard, lead list, pipeline, follow-ups, site visits, calling/WhatsApp entry points, import/export entry point, analytics, and theme settings are present in `App.tsx`.
- Platform administration: `src/SuperAdmin.tsx`.
- Company/platform admin control area: `src/AdminControlCenter.tsx`.
- Additional module shell: `src/WorkspaceSuite.tsx`.
- Supabase client: `src/supabase.ts`.

## Defects / incomplete frontend areas confirmed
1. `WorkspaceSuite` uses a generic action-card + local-draft pattern for many modules; these are not complete module screens or live CRUD.
2. Dashboard metrics inside `WorkspaceSuite` are placeholders, not live KPIs.
3. Internal Chat previously generated local mock messages and was not connected to the existing chat backend. The mock composer was removed; the screen now explicitly marks the integration contract as pending rather than pretending messages are real.
4. Provider API secret input was previously persisted with browser settings. It now stays in component memory only and is not written to localStorage. Secure storage and connection tests require backend vault support.
5. UPI/provider configuration currently remains browser-side draft state, not a platform-wide persisted configuration.
6. Team/attendance, duplicate merge, bookings, document management, workflow builder, custom fields, plans/entitlements, public pages, notifications and audit views still need real screens and interaction flows.
7. Role navigation is a frontend visibility convenience only. It is not a substitute for Supabase RLS or server-side authorization.

## Supabase evidence available
The supplied CSV is a Row Level Security policy export. It includes policies for `audit_logs`, `call_logs`, `companies`, `company_settings`, `follow_ups`, `lead_activities`, `leads`, `notifications`, `platform_admin_audit_logs`, `platform_admins`, `profiles`, `projects`, `property_units`, and `site_visits`.

The supplied export does not include chat table definitions, chat RPCs, storage bucket names, realtime publication details, or message/channel schemas. Therefore the existing chat backend cannot be safely wired from this export alone.

## Build verification status
`npm run build` was attempted but could not run because the installed `node_modules` tree is incomplete: TypeScript reports missing `vite/client` and `node` type definitions. A clean `npm ci --no-audit --no-fund` attempt timed out. Build status is **not verified**.

## Release gate
Do not upload this working copy as the final frontend. Release only after all requested screens are implemented, source-level checks pass, dependencies install cleanly, `npm run build` succeeds, and the final ZIP is created and checked.
