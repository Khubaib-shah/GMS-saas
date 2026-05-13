# GymFlow (GMS-SaaS) - Comprehensive System Documentation

## 1. Executive Summary

### What The App Does
GymFlow is a comprehensive, multi-tenant B2B Software as a Service (SaaS) platform designed to digitize and automate the entire operational lifecycle of modern gyms, fitness centers, and health clubs. It provides a unified ecosystem that serves everyone involved: 
*   **Super Admins:** The creators of the software who manage the SaaS business.
*   **Gym Owners & Managers:** To track revenue, staff, and overall business health.
*   **Staff & Receptionists:** To manage attendance, point-of-sale (POS), and daily operations.
*   **Personal Trainers:** To build workout templates, manage bookings, and track client progress.
*   **Gym Members:** To log workouts, view subscriptions, and access the facility.

### The Problem It Solves
Historically, gyms operate using highly fragmented systems. An owner might use Excel for billing, a physical ledger for attendance, a generic POS for selling water/supplements, and trainers rely on paper notebooks to track client progress. 
**The pain points include:**
*   **Revenue Leakage:** Members sneaking in with expired plans or unpaid dues.
*   **Inefficiency:** Receptionists manually verifying members takes too long during peak hours.
*   **Lack of Data Insight:** Owners cannot easily see their Monthly Recurring Revenue (MRR), churn rates, or most popular membership plans.
*   **Poor Member Experience:** Members have no digital way to track their own fitness journey or view their membership status.

### How We Solved It
We solved this by building a centralized, cloud-based infrastructure with distinct portals (Staff Dashboard and Member Portal). 
*   We replaced manual entry with **QR-code based access control**.
*   We replaced paper accounting with **automated subscription lifecycle management**.
*   We replaced disjointed selling with an integrated **Inventory & Point of Sale (POS) module**.
*   We replaced physical trainer notebooks with an interactive **Workout Assignment & Logging engine**.

---

## 2. Comprehensive Module Breakdown

Based on the backend architecture, here is a detailed explanation of every single module in the system and what it achieves.

### Authentication, Access & Security
*   **`auth` / `register`**: Handles the secure onboarding of new gyms. It utilizes NextAuth for robust session management, ensuring staff members can log in securely using encrypted credentials.
*   **`roles`**: Implements Role-Based Access Control (RBAC). It defines strict permissions so a receptionist can only check people in and sell products, while a manager can view financial reports, and an owner has total control over deletion and settings.
*   **`audit-logs`**: A critical security feature. It tracks *who did what and when*. If a payment is deleted or a subscription is altered, the audit log records the user, timestamp, and IP address, ensuring total staff accountability.
*   **`member-portal`**: A specialized, separate authentication flow built explicitly for gym members, utilizing a Fast PIN or Password system for frictionless entry into their personal dashboards.

### Gym Operations & Management
*   **`gym`**: The core tenant entity. Manages the gym's global profile, location data, and supports multiple branches/franchises under one umbrella.
*   **`settings`**: Configuration hub for the gym. Owners define operating hours, tax rates, currency, and strict attendance rules (e.g., preventing a member from checking in twice in one hour to prevent QR code sharing).
*   **`staff`**: Human resources module. Allows the owner to invite employees, assign them specific roles, and revoke access when an employee leaves.

### Membership & Attendance
*   **`members` / `member`**: The CRM (Customer Relationship Management) core. Stores detailed member profiles, medical history, emergency contacts, assigned trainers, and generates a unique, scannable QR code for every member.
*   **`attendance`**: The check-in engine. Receptionists can scan a member's QR code. The system instantly verifies if their subscription is active. If expired, it flashes red and denies entry. If active, it logs the check-in time, providing data for peak-hour analytics.

### Financials, Billing & Subscriptions
*   **`plans`**: Allows gyms to create customized membership tiers (e.g., "Basic Monthly", "Student Quarterly", "VIP Yearly") with specific pricing and durations.
*   **`subscriptions`**: The lifecycle tracker. When a member buys a plan, a subscription is generated. This module calculates exact expiry dates and transitions statuses from "Active" to "Expired" or "Suspended".
*   **`payments` / `billing`**: The ledger. It records every transaction made by a member, supporting cash, credit card, or bank transfers. It generates electronic receipts and feeds directly into the gym's revenue analytics.

### Point of Sale (POS) & E-Commerce
*   **`products`**: Inventory management. Gyms can add physical items like Whey Protein, Energy Drinks, Gym Towels, or T-shirts. It tracks stock levels and prices.
*   **`selling`**: The digital cash register. Receptionists use this module to sell `products` over the counter. It deducts from inventory and logs the transaction as "Product Revenue" separately from "Subscription Revenue" for accurate financial reporting.

### Fitness, Workouts & Trainers
*   **`trainers` / `trainer`**: Profiles for personal trainers, highlighting their specialties (e.g., CrossFit, Rehab) and hourly rates. Manages their availability schedules and member bookings.
*   **`exercises`**: A massive global library of exercises categorized by muscle group, equipment needed, and difficulty level.
*   **`workout-templates`**: Trainers can build reusable programs (e.g., "12-Week Powerlifting Split").
*   **`workout-assign` / `workout-plans`**: The act of customizing a template and attaching it to a specific paying member's profile.
*   **`workout-log` / `exercise-completion`**: The interactive module used by members on the gym floor. They open their phones, see today's assigned exercises, and log the exact sets, reps, and weights lifted, providing historical progress tracking.

### System Automation & Infrastructure
*   **`cron`**: The automated robot of the app. It runs in the background at midnight to check all subscriptions. If a subscription reaches its end date, the `cron` job automatically flips it to "Expired" so the member cannot check in the next morning. It also handles automated email/SMS reminders.
*   **`upload` / `gallery`**: Media management integration (Cloudinary/AWS). Handles uploading member profile pictures, gym facility marketing images, and custom exercise demonstration videos.
*   **`seed`**: Developer & Sales tool. Automatically populates a blank database with thousands of realistic members, payments, and attendance logs so the app looks "alive" when pitching to a prospective gym owner client.
*   **`v1`**: The API versioning architecture, ensuring that if we build a native iOS/Android mobile app in the future, it has a stable API endpoint to communicate with without breaking the web dashboard.

### SaaS Business Administration (The "Super Admin")
*   **`super-admin` / `platform`**: The overarching control center for *you* (the software creator). Here you monitor how many gyms are using your software.
*   **`request-demo`**: A landing page hook. Prospective gyms fill out a form, which feeds into this module as a hot lead for your sales team.
*   **`billing` (Platform Level)**: Where gyms pay *you* for using the software. It handles Stripe subscriptions, feature flags (restricting POS selling to "Enterprise" clients only), and tenant suspension if a gym fails to pay their monthly SaaS invoice.

---

## 3. Summary of Value
GymFlow transforms a gym from a chaotic, paper-driven room with weights into a **data-driven technology business**. Owners prevent revenue loss at the door, members feel premium value through the portal, and you (the SaaS owner) possess a highly scalable, recurring-revenue engine.
