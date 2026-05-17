# GMS SaaS - Project Documentation

## 1. Project Overview
**GMS SaaS** (Gym Management System) is a modern, full-stack web application designed to help gym owners manage their daily operations. It acts as a comprehensive dashboard for tracking members, subscriptions, payments, and attendance. It is built as a SaaS platform, supporting multiple gyms with premium feature gating.

## 2. Technology Stack
The project leverages a modern React-based stack optimized for performance and type safety:

- **Frontend**: 
  - **Next.js 16 (App Router)**: The core framework handling routing, server-side rendering, and API routes.
  - **React 19**: Using the latest React features including Hooks and Server Components.
  - **TypeScript**: Ensures type safety across the entire codebase.
  - **Tailwind CSS 4**: For responsive and utility-first styling.
  - **shadcn/ui & Radix UI**: Provides accessible, high-quality UI components (Dialogs, Tables, Toasts, etc.).
  - **Recharts**: For visualizing data in the analytics dashboard.

- **Backend**:
  - **Next.js API Routes**: Serverless functions handling backend logic (`/app/api`).
  - **MongoDB & Mongoose**: The database layer for storing structured data (Users, Members, Plans, etc.).
  - **NextAuth.js**: Handles secure authentication and session management.
  - **Bcryptjs**: specialized for secure password hashing.

## 3. Architecture & Directory Structure
The project follows the standard Next.js App Router structure:

- **`app/`**: Contains all routes and pages.
  - `(auth)/login`: Authentication page.
  - `dashboard/`: The main entry point after login.
  - `members/`, `payments/`, `subscriptions/`: Feature-specific pages.
  - `api/`: Backend API endpoints organized by feature (e.g., `api/members`, `api/auth`).
- **`components/`**: Reusable UI blocks.
  - `ui/`: Core shadcn components (buttons, inputs).
  - Feature components like `members-table.tsx`, `navbar.tsx`, etc.
- **`models/`**: Mongoose schemas defining the data structure (User, Member, Gym, etc.).
- **`lib/`**: Utility functions, database connection logic (`db.ts`), and Auth configuration (`auth-options.ts`).

## 4. Key Features

### 4.1 Authentication & Authorization
- **Secure Login**: Users log in via email/password.
- **Role-Based Access**: Distinguishes between `admin` and standard `user` roles.
- **Gym Context**: Each user is associated with a specific `Gym`. The system checks if the Gym is "Premium" to gate certain features (like QR Code scanning).

### 4.2 Member Management
- **CRUD Operations**: Add, Edit, and Delete gym members.
- **Profile Details**: Stores personal info (Age, Gender, Contact), Emergency Contacts, and Status (Active/Inactive).
- **Search & Filter**: Real-time searching of members.

### 4.3 Subscription & Plans
- **Plan Creation**: Admins can define membership plans (e.g., "Gold Plan", "Monthly Basic") with specific durations and prices.
- **Subscription Tracking**: Assign plans to members. The system automatically calculates start and end dates.
- **Status Monitoring**: Visual indicators for Active vs. Expired subscriptions.

### 4.4 Financials & Payments
- **Payment Recording**: Log payments made by members.
- **Revenue Analytics**: Visual charts showing income over time.
- **Due Tracking**: Identify members with pending payments.

### 4.5 Attendance System
- **Manual Check-in**: Staff can manually mark a member as present.
- **QR Code Scanning**: A premium feature allowing members to scan a QR code for automatic check-in.
- **Real-time Logging**: Records check-in/out times.

## 5. User Flow

1.  **Entry**: User visits the landing page (`/`).
2.  **Authentication**:
    - Automatically redirects to `/login` if not authenticated.
    - Upon successful login (verified against MongoDB), the user is redirected to the `/dashboard`.
3.  **Dashboard**:
    - User sees an overview: Total Active Members, Monthly Revenue, Recent Activity.
    - Navigation Sidebar allows switching between modules (Members, Subscriptions, Payments).
4.  **Operational Flows**:
    - **Add Member**: User navigates to Members -> Click "Add Member" -> Fills form -> Data saved to DB.
    - **process Payment**: User navigates to Payments -> Selects Member -> Records amount.
    - **Check-in**: User navigates to Attendance -> Scans QR or Manually checks user in.

## 6. Data Schema (Models)

- **User**: The system admin/staff account. Links to a specific `Gym`.
- **Gym**: Represents the physical gym entity. Contains settings (like `isPremium`).
- **Member**: A customer of the gym. Linked to `Gym`.
- **Plan**: A template for a membership (Name, Price, Duration).
- **Subscription**: An instance of a Plan assigned to a Member. Tracks `startDate`, `endDate`, and `status`.
- **Payment**: Financial record linked to a Member and Subscription.
- **Attendance**: Daily log of member visits (`checkInTime`, `checkOutTime`).

This document provides a complete high-level understanding of the GMS SaaS application structure and functionality.

## 7. Security & Compliance Architecture

The system implements strict enterprise-grade security and compliance protocols to ensure tenant isolation and protect sensitive member data:

### 7.1 Multi-Tenant Isolation
Multi-tenancy is enforced globally via a custom Mongoose plugin (`lib/mongoose-tenant-plugin.ts`) combined with Node's `AsyncLocalStorage`.
- **Global Scoping**: When an API request begins, the active `gymId` is bound to the AsyncLocalStorage context.
- **Automatic Scoping**: The Mongoose plugin automatically intercepts all query types (`find`, `findOne`, `updateOne`, `deleteMany`, etc.) and injects `gymId` scoping automatically.
- **Leak Protection**: Attempts to execute a query containing a mismatched `gymId` compared to the active tenant context are automatically blocked with a runtime error, preventing IDOR/BOLA data leaks.

### 7.2 Input Validation & Mass Assignment Guard
All critical write endpoints (POST/PUT) are protected against Mass Assignment attacks.
- **Zod Schemas**: Strict schemas defined in `lib/validations.ts` parse and whitelist incoming parameters for Members, Subscriptions, Payments, Staff, and Signup requests.
- **Constraint Enforcement**: Enforces strong validation, format compliance (emails, URIs), and optional field sanitization before data touches database schemas.

### 7.3 Rate Limiting & Brute-Force Protection
- **Sliding-Window Throttling**: A Redis-backed sliding-window rate limiter (`lib/rate-limiter.ts`) restricts public write operations (Signup capped at 5/hour per IP, Member Portal Login at 10/15-minutes per IP).
- **Brute-Force Lockout**: Staff and member logins track failed attempts. 5 consecutive failures trigger a 15-minute account lockout, updating persistent counters in MongoDB.

### 7.4 Transport Security & HTTP Headers
Strict production headers are appended to all requests inside `next.config.mjs`:
- **HSTS (Strict-Transport-Security)**: Enforces TLS/HTTPS usage over a 2-year window including subdomains.
- **CSP (Content-Security-Policy)**: Restricts allowed source connections to a strict whitelist (Stripe, Cloudinary, Google Fonts).
- **Redirection**: HTTP connections are automatically redirected to HTTPS via middleware (`middleware.ts`).
- **Additional guards**: `X-Frame-Options: DENY` (Anti-Clickjacking), `X-Content-Type-Options: nosniff` (Anti-MIME-sniffing), and secure Referrer-Policies.

### 7.5 Database Backups
- **Automated Archives**: `scripts/db-backup.ts` handles gzipped mongodumps with local retention (7 days) and direct secure upload capability to AWS S3.

