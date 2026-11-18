# CODEVEX CRM – Frontend Control Center Update

This package is based on the project ZIP supplied in the conversation. Existing React + TypeScript + Vite and Supabase files are retained.

## Added in this frontend pass
- Super Admin Control Center entry in the existing Super Admin screen.
- Control Center sections: Overview, Lead Control, API & Integrations, Plans & Payments, Feature Manager, Public Pages, Audit & Activity.
- Lead assignment/reassignment UI using the existing `leads.assigned_to` field and existing `profiles` table.
- Subscription plan editor draft, QR/UPI configuration draft, API provider configuration draft, feature toggles and About/Privacy content editor draft.
- Public page paths `/about` and `/privacy-policy`.
- Responsive layout for the new Control Center.

## Important implementation boundary
This is a frontend-first update, not a completed production SaaS backend. Draft settings currently use browser localStorage and are not shared across devices/users. API secrets are not stored or sent. No portal API/webhook is activated. QR/UPI payments are not automatically verified. Automatic payment activation requires a supported payment gateway, server-side webhook signature verification and database updates. Likewise, feature toggles are UI drafts and are not authorization controls until enforced server-side.

The Lead Control screen reads current company/lead/profile data and updates the existing `leads.assigned_to` field. Assignment history, response-time event capture, full call/visit/booking funnel metrics and immutable audit records require backend schema/functions and will be checked in the requested final backend audit.

## Run
1. Upload/extract this project into StackBlitz as a Vite React TypeScript project.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in StackBlitz environment variables using your existing Supabase project values.
3. Run `npm install`, then `npm run dev`.
4. Sign in with an account that is present in `platform_admins` to access Super Admin. Use **Control Center** in the top header.

## Build verification
A local production build could not be completed in this environment because npm dependencies were not fully available for installation. Run `npm install` and `npm run build` in StackBlitz; resolve any compiler output before deployment.
