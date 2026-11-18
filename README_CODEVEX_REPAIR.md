# CODEVEX – repaired frontend package

Based on the latest uploaded project ZIP.

## Changes in this repair
- Fixed Super Admin header/control button text contrast so the white refresh/control button has readable dark text.
- Added responsive wrapping for the Super Admin header.
- Improved Admin Control Center mobile spacing, input contrast, tab/button visibility, grids and horizontally scrollable tables.
- Preserved existing React, TypeScript, Vite, Supabase, CRM, Auth and Admin Control Center source files.

## Validation
- TypeScript/TSX syntax transpilation check passed for all files in `src/`.
- A full `npm run build` has NOT been confirmed in this environment because the dependency install could not complete. Run `npm install` then `npm run build` in StackBlitz to verify type-checking and production build.

## Important functionality status
Some Admin Control Center settings are currently browser-local drafts, not persistent platform settings. API execution, portal webhooks, automatic payment verification, subscription activation, server-side role enforcement and durable About/Privacy publishing require the later Supabase/Edge Function/backend phase. This package does not claim those integrations are live.

## StackBlitz
1. Import this ZIP into the existing StackBlitz project (or extract into a fresh project).
2. Run `npm install`.
3. Run `npm run dev`.
4. For production verification run `npm run build`.
