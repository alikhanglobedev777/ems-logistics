# Logistics Command Center UI Migration

This frontend now uses a shared "Logistics Command Center" enterprise theme built around the existing EMS architecture.

What changed:

- Global design tokens moved into [globals.css](/abs/path/C:/Users/Solutyics/Desktop/ems-logistics/ems-logistics/apps/web/src/styles/globals.css).
- The shell layout now runs through reusable sidebar, topbar, and app shell components in `apps/web/src/components/layout`.
- Shared enterprise UI primitives were expanded in `packages/ui` for tables, headers, badges, filters, forms, modals, tabs, and state views.
- The generic `MasterDataPage` now applies the shared theme to list, detail, and form routes.
- Dashboard, bookings, trips, fuel slips, invoices, and reports were updated as the anchor screens for the new theme.

Notes:

- The migration preserves the current API contract and route structure.
- Some module-specific pages still inherit the new theme mainly through `MasterDataPage` rather than custom layouts.
- Fuel slip rejection and booking cancellation still use browser prompts for reasons; this keeps current behavior simple without introducing backend changes.
