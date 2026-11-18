# CODEVEX Frontend Handoff

## Included
- Existing React + TypeScript + Vite application and Supabase client.
- Existing CRM workspace, authentication and Super Admin entry point retained from the supplied project.
- Expanded Super Admin Control Center sections: Overview, Lead Control, API Integrations, UPI & Payments, Plans, Features, Lead Sources, Roles, Workflows, Templates, Custom Fields, Notifications, Branding, Public Pages, Audit Logs.
- Provider-specific draft cards for 99acres, Magicbricks, Housing.com, Razorpay, WhatsApp Business API, SMS, Calling, Google Sheets and custom webhooks.
- UPI ID, payee name, QR URL, payment instructions and company-panel visibility draft settings.
- Editable plans, module toggles, lead sources, roles, workflow rules, WhatsApp templates, custom fields, notification rules, branding and About/Privacy content.
- Responsive styling for mobile layouts.

## Important status
This handoff is the frontend/configuration phase only, as requested. Super Admin configuration currently persists in browser localStorage for UI prototyping. It does not yet synchronize settings between users or companies. Provider credentials are placeholders and must not be treated as a live secret vault. No provider API calls, payment verification, subscription enforcement, public page publishing, server-side permissions, or workflow execution are implemented in this frontend phase.

## Backend phase still required
- Supabase tables/RLS for platform settings, provider integrations, feature entitlements, plan subscriptions, custom fields, workflows, templates, notifications, public pages, payment records and audit events.
- Secure Edge Functions / server-side secret storage for provider credentials and webhook processing.
- Razorpay or other gateway signature verification and payment status updates.
- Runtime enforcement of roles, feature flags, plan limits and tenant boundaries.
- Cross-company settings propagation for UPI/payment display and public pages.

## Setup
1. Upload/extract this project into StackBlitz or another Vite-compatible workspace.
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Build verification was not completed in this environment because dependency installation timed out. Run `npm run build` in the workspace and resolve any compiler errors before production deployment.

Do not deploy this frontend as production-ready until the backend phase and build verification are complete.
