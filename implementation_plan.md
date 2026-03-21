# Implementation Plan - Advanced Feature Expansion

This plan outlines the introduction of high-value, advanced features for gym owners. These features will be available as "feature flags" in the subscription plans, allowing you to monetize them as part of the "Professional" or "Enterprise" tiers.

## User Review Required

> [!IMPORTANT]
> The following list of features is proposed for inclusion in the [PlatformPlan](file:///d:/Programing%20work/Products/GMS-saas/components/landing/pricing-section.tsx#8-18) feature-set. Please review if you would like any specific additions or removals.

### Proposed Advanced Features
1.  **Lead Management (CRM)**: Track potential members from inquiry to orientation.
2.  **Inventory & POS**: Manage the sales of supplements, water, and gear at the reception.
3.  **Expense & P&L Manager**: Track gym overheads (rent, bills, maintenance) alongside revenue.
4.  **Staff Payroll & Commissions**: Direct salary calculations based on trainer sessions or sales.
5.  **Marketing Automations**: Trigger SMS/Email messages for birthdays, renewals, or trial followups.
6.  **Biometric Sync Support**: Dedicated flag for hardware integration with fingerprint/face-readers.
7.  **Class & Studio Scheduling**: Professional booking system for Yoga, HIIT, and Group Classes.
8.  **WhatsApp Integration**: Sending automated PDF receipts and alerts via WhatsApp.
9.  **AI Business Insights**: Member churn prediction and growth forecasting.

## Proposed Changes

### [Component Name] Super Admin Dashboard

#### [MODIFY] [page.tsx](file:///d:/Programing%20work/Products/GMS-saas/app/super-admin/plans/page.tsx)
- Update `FEATURE_OPTIONS` constant to include the new strings.
- This will allow you to toggle these features on/off when creating or editing plans.

### [Component Name] Database Seeding

#### [MODIFY] [seed-database.ts](file:///d:/Programing%20work/Products/GMS-saas/scripts/seed-database.ts)
- Update default "Professional" and "Enterprise" plans to include these new features by default.

### [Component Name] Business Logic (Future Steps)
- These flags can now be used in the `requirePermission` middleware or component-level checks to hide/show these advanced modules based on the gym's plan.

## Verification Plan

### Automated Tests
- Create a plan with all new feature flags via the UI.
- Verify the plan is saved correctly in the database with the new array values.

### Manual Verification
- View the "Edit Plan" modal in the super-admin dashboard and confirm all 20+ feature options are available for selection.
