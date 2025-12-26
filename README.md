<div align="center">

# 🏋️ GMS SaaS - Gym Management System

### A Modern, Full-Stack Gym Management Solution

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.0-47a248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**GMS SaaS** is a comprehensive, modern gym management system built with cutting-edge technologies. Designed to streamline gym operations, it provides powerful tools for managing members, subscriptions, payments, and analytics—all in one beautiful, intuitive interface.

### ✨ Why GMS SaaS?

- 🎯 **Complete Solution**: Manage everything from member registration to payment tracking
- 🚀 **Modern Stack**: Built with Next.js 16, React 19, and TypeScript for maximum performance
- 🎨 **Beautiful UI**: Sleek, responsive design with dark mode support
- 🔐 **Secure**: Built-in authentication and authorization with NextAuth
- 📊 **Analytics**: Real-time insights with interactive charts and dashboards
- 💳 **Payment Tracking**: Comprehensive payment and subscription management

---

## 🌟 Features

### 👥 Member Management
- **Complete Member Profiles**: Track personal information, contact details, and membership status
- **Member Search & Filter**: Quickly find members with powerful search capabilities
- **Status Tracking**: Monitor active, inactive, and expired memberships
- **Member History**: View complete payment and subscription history

### 💰 Subscription & Payment Management
- **Flexible Plans**: Create and manage multiple subscription plans
- **Payment Tracking**: Record and monitor all payments with detailed history
- **Automated Calculations**: Automatic due date and expiry calculations
- **Payment Status**: Track pending, completed, and overdue payments

### 📊 Analytics & Reporting
- **Interactive Dashboards**: Real-time statistics with beautiful charts
- **Revenue Tracking**: Monitor income trends and payment patterns
- **Member Analytics**: Track growth, retention, and engagement metrics
- **Visual Reports**: Powered by Recharts for stunning data visualization

### 🎨 User Experience
- **Dark Mode**: Eye-friendly dark theme with seamless switching
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Modern UI Components**: Built with Radix UI and shadcn/ui
- **Smooth Animations**: Delightful interactions with Tailwind animations

### 🔐 Security & Authentication
- **Secure Login**: NextAuth-powered authentication
- **Role-Based Access**: Admin and user role management
- **Protected Routes**: Middleware-based route protection
- **Password Encryption**: Bcrypt-secured password storage

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, customizable components

### Backend & Database
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - Elegant MongoDB object modeling
- **[NextAuth](https://next-auth.js.org/)** - Authentication for Next.js
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Password hashing

### UI & Visualization
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[Lucide Icons](https://lucide.dev/)** - Beautiful, consistent icons
- **[date-fns](https://date-fns.org/)** - Modern date utility library
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### State & Forms
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Performant form handling
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.0 or higher
- **npm** or **pnpm** package manager
- **MongoDB** database (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Khubaib-shah/GMS-saas.git
   cd GMS-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # NextAuth
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # App
   NODE_ENV=development
   ```

4. **Create an admin user** (Optional)
   ```bash
   node create-admin.js
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
GMS-saas/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── members/         # Member CRUD operations
│   │   ├── payments/        # Payment management
│   │   ├── plans/           # Subscription plans
│   │   └── subscriptions/   # Subscription management
│   ├── admin/               # Admin dashboard
│   ├── dashboard/           # Main dashboard
│   ├── login/               # Login page
│   ├── members/             # Member management pages
│   ├── payments/            # Payment pages
│   ├── settings/            # Settings pages
│   └── subscriptions/       # Subscription pages
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard-charts.tsx # Chart components
│   ├── members-table.tsx    # Member table
│   ├── navbar.tsx           # Navigation bar
│   └── sidebar.tsx          # Sidebar navigation
├── lib/                     # Utility functions
├── models/                  # Mongoose models
│   ├── User.ts             # User model
│   ├── Member.ts           # Member model
│   ├── Plan.ts             # Plan model
│   ├── Subscription.ts     # Subscription model
│   ├── Payment.ts          # Payment model
│   └── Gym.ts              # Gym model
├── hooks/                   # Custom React hooks
├── styles/                  # Global styles
└── public/                  # Static assets
```

---

## 📚 Documentation

### API Routes

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/register` - User registration

#### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Create new member
- `PUT /api/members` - Update member
- `DELETE /api/members` - Delete member

#### Plans
- `GET /api/plans` - Get all plans
- `POST /api/plans` - Create new plan
- `PUT /api/plans` - Update plan
- `DELETE /api/plans` - Delete plan

#### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `POST /api/subscriptions` - Create subscription

#### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment
- `DELETE /api/payments` - Delete payment

### Database Models

#### User
```typescript
{
  username: string
  email: string
  password: string (hashed)
  role: 'admin' | 'user'
  gymId: ObjectId
}
```

#### Member
```typescript
{
  name: string
  email: string
  phone: string
  address: string
  dateOfBirth: Date
  gender: string
  emergencyContact: string
  status: 'active' | 'inactive' | 'expired'
  gymId: ObjectId
}
```

#### Plan
```typescript
{
  name: string
  duration: number (days)
  price: number
  description: string
  gymId: ObjectId
}
```

---

## 🎨 UI Components

Built with **shadcn/ui** and **Radix UI**, the project includes:

- ✅ Buttons, Inputs, Forms
- ✅ Dialogs, Modals, Alerts
- ✅ Tables, Cards, Tabs
- ✅ Dropdowns, Selects, Popovers
- ✅ Charts, Progress Bars
- ✅ Toast Notifications
- ✅ Dark Mode Toggle
- ✅ Responsive Navigation

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Utilities
node create-admin.js # Create admin user
node verify-api.js   # Verify API endpoints
```

---

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `NODE_ENV` | Environment (development/production) | ⚠️ |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 📝 License

This project is private and proprietary.

---

## 👨‍💻 Author

**Khubaib Shah**

- GitHub: [@Khubaib-shah](https://github.com/Khubaib-shah)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Primitive components
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Built with ❤️ using Next.js and TypeScript**

</div>
