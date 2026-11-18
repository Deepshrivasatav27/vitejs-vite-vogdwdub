# CODEVEX Frontend – Consolidated Workspace

This package preserves the existing React/Vite/Supabase application and adds a consolidated role-aware Workspace Suite.

## Included
- Existing authentication flow and Super Admin area.
- Existing CRM application and lead workflows.
- Workspace Suite navigation with profile-role based visibility for Super Admin, Master Admin, Admin, Manager and Agent.
- Module screens/catalog for Dashboard, Leads, assignment/transfer, duplicate review, Calling, WhatsApp, Internal Chat UI, Follow-ups, Site Visits, Projects, Inventory, Booking, Import/Export, Reports, Team/Attendance, Notifications, Company Settings, API integrations, UPI/payments, Plans, Features, Roles/Permissions, Lead Sources, Custom Fields, Workflows, Templates, Branding, Public Pages, Audit Logs, Documents and Recovery.
- API provider configuration UI for 99acres, Magicbricks, Housing.com, WhatsApp Business API, Razorpay, SMS, Calling, Google Sheets and Custom Webhooks.
- UPI fields for UPI ID, payee name, QR image URL and instructions.
- Responsive layouts and local draft interactions for frontend review.

## Important implementation boundary
This is a frontend foundation, not a claim that every module is already connected to live data. Configuration drafts currently use browser localStorage. The Internal Chat screen is a UI shell and is not yet bound to the user's existing chat schema/API because that schema was not included in the source package. API credentials must not be sent to public browser storage in production; secure server-side storage is required in the backend phase. Import/export, provider connection tests, payment verification, real-time chat, workflows and analytics need their agreed backend/provider wiring.

## Build
```bash
npm install
npm run build
npm run dev
```

The source environment used to prepare this package did not have a complete installable node_modules tree. `npm run build` could not be verified here because TypeScript reported missing `vite/client` and `node` type definitions; a clean `npm ci` attempt was interrupted by the execution environment. Run the commands above in StackBlitz/Replit and resolve any reported compile errors before deployment.

## Role note
The Workspace Suite reads `profiles.role` and changes visible navigation accordingly. The Super Admin remains in the existing platform-admin route. UI visibility is not security enforcement; backend RLS and authorization remain authoritative.
