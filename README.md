# JeansLoop Admin Dashboard

Administrative control panel and operational dashboard for JeansLoop built with Next.js 15 App Router, React 18, Recharts, and Tailwind CSS.

## Features & Improvements
- **Unified Product Form**: Replaced ~1200 lines of duplicated code across `new` and `[id]` pages with a single modular `ProductForm` supporting image upload, size charts, variant matrices, and highlights.
- **Analytics Command Center**: Real-time sales charts, revenue metrics, top-selling items, and low-stock indicators using Recharts.
- **Debounced Search Tables**: Built-in 400ms debouncing on products, orders, and user management tables preventing server spam.
- **Non-blocking Confirmations**: Removed browser `alert()` and `confirm()` modals; replaced with accessible `ConfirmDialog` and Sonner toast notifications.
- **Order Lifecycle & Invoicing**: Order status tracking (Pending -> Accepted -> Couriered -> Delivered), tracking number assignment, and printable invoices.
- **Store Configuration**: Full control over store branding, logo upload, announcement bar ticker, business hours, and social media connectivity.
- **Role Security**: Protected layout with automatic admin authentication verification and redirect guards.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Library**: React 18
- **Data Fetching**: TanStack Query 5 + Axios API client
- **Visualizations**: Recharts 2
- **Styling**: Tailwind CSS + `clsx` + `tailwind-merge`
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## Directory Structure
```
src/
├── app/
│   ├── dashboard/
│   │   ├── orders/             # Order list, details, and printable invoice
│   │   ├── products/           # Catalog management, new, edit
│   │   ├── settings/           # Categories, Coupons, Site configuration
│   │   ├── sliders/            # Promotional slider editor
│   │   ├── users/              # User list with spending stats
│   │   ├── layout.tsx          # Sidebar layout & Auth Guard
│   │   └── page.tsx            # Analytics Overview Command Center
│   ├── layout.tsx              # Root HTML & Providers
│   └── page.tsx                # Admin Authentication Login
├── components/
│   ├── forms/                  # Reusable ProductForm component
│   └── ui/                     # SearchInput, ConfirmDialog, Button, Card, Input
└── lib/                        # API client, TypeScript definitions, utils
```

---

## Setup & Running

### 1. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development & Build
```bash
# Run in development mode on port 3001
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

---

## Docker Support
```bash
docker build -t jeansloop-admin .
docker run -p 3001:3001 --env-file .env.local jeansloop-admin
```
