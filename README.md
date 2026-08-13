# Bazaar 🚀 - Production-Grade Multi-Tenant Retail POS & Management SaaS Platform

Bazaar is a production-ready, offline-first Point of Sale (POS) and Multi-Tenant Retail Management SaaS platform built to empower retail stores, multi-branch chains, and SMEs with real-time stock control, printable tax invoices, sales analytics, and strict database-level multi-tenancy.

[🔗 Live Demo](https://bazaar-pos.vercel.app) <!-- Replace with your deployed URL if available -->

---

## 🛡️ Admin Role Walkthrough & Screenshot Showcase

Here is a step-by-step visual demonstration of what the **Admin User (`admin@bazaar.com`)** experiences inside Bazaar—from initial store setup to real-time checkout processing, analytics reporting, and invoice management.

---

### 1. Admin System Control Center (Initial State)
![Admin Dashboard Initial](public/screenshots/admin_dashboard_initial.png)
> **What is happening here:**
> - The **Admin Dashboard** initializes displaying real-time operational status (`Operational`, `2 cashiers online`, register opened at `9:00 AM`).
> - Metrics display initial total revenue (**$0.00**) and 0 transactions prior to store activity.
> - Indicators track overall **Stock Health (92%)**, **Sales Goals (78%)**, active products count (10 items), and live **Inventory Alerts** (3 items low in stock).

---

### 2. POS Checkout Terminal & Active Order Processing
![Admin POS Checkout](public/screenshots/admin_pos_checkout.png)
> **What is happening here:**
> - The Admin accesses the **Checkout Terminal (`/pos`)** to ring up a retail transaction.
> - The product grid displays live stock pills (*In Stock*, *Low Stock* warnings) with image previews across categories (*Groceries, Electronics, Apparel, Accessories, Furniture*).
> - The **Order Summary** side panel displays 10 items in cart (including Ergonomic Desk Chairs & Mechanical Keyboards) calculating a **Total Due of $1,182.46**.

---

### 3. Real-Time Dashboard Update (Post-Checkout)
![Admin Dashboard Active](public/screenshots/admin_dashboard_active.png)
> **What is happening here:**
> - Immediately after completing the checkout sale, the Admin Dashboard automatically updates via database reactivity.
> - Today's revenue jumps to **$1,182.46** for **1 order**.
> - The **Live Operations Feed** logs `"Sale completed ($1182.46) 1 min ago"`.
> - The **Recent Checkout Log** records the exact PostgreSQL transaction UUID (`b85a7668-b856-4c0a...`) at `09:21 PM`.

---

### 4. Business Intelligence & Financial Analytics
![Admin Reports](public/screenshots/admin_reports.png)
> **What is happening here:**
> - The Admin opens **Reports & Analytics (`/reports`)** for executive financial oversight.
> - Tracks revenue trends, average ticket size, and volume across flexible time filters (`Today`, `7 Days`, `30 Days`, `All Time`).
> - Provides a **Sales by Category** percentage breakdown (*Groceries 35%, Electronics 28%, Apparel 18%, Beauty 12%, Furniture 7%*) and a **Top Performing Products** leaderboard ranked by lifetime sales revenue (*Wireless Bluetooth Earbuds: $7,519.06*, *Mechanical Keyboard: $6,819.38*).

---

### 5. Enterprise Invoices & Tax Receipts Hub
![Admin Invoices](public/screenshots/admin_invoices.png)
> **What is happening here:**
> - The Admin visits **Invoices & Receipts (`/invoices`)** to manage customer transactions and issue tax documents.
> - Features executive stat cards (*Total Invoices, Revenue, Units Delivered, Avg Basket Size*).
> - Offers filter tabs (*All Invoices*, *Today*, *High Value $100+*), search bar by customer name/phone/invoice ID, and action triggers to open printable A4 / 80mm thermal tax invoice modals.

---

## 👔 Manager Role Walkthrough & Screenshot Showcase

Here is what the **Store Manager (`manager@bazaar.com`)** sees and can perform inside Bazaar:

---

### 1. Manager Control Center (`ROLE: MANAGER`)
![Manager Dashboard](public/screenshots/manager_dashboard.png)
> **What is happening here & RBAC Enforcement:**
> - **Active Navigation Links**: The sidebar explicitly displays `ROLE: MANAGER` with access restricted to **Dashboard**, **Inventory**, **Invoices**, and **Checkout**.
> - **Hidden Confidential Sections**: **Products** (catalog master editing) and **Reports** (executive profit analytics) are automatically hidden from the navigation menu to protect store financial data.
> - **Operational Actions**: Under quick actions, **"Manage Catalog"** is hidden/disabled, allowing the Manager to perform store operations: **"Check Stock Count"** and **"Launch POS Terminal"**.
> - **Operational Overview**: Manager monitors real-time sales revenue (**$1,182.46**), store stock health (92%), inventory low-stock alerts, and recent checkout transactions.

---

### 2. Manager Customer Invoice & Tax Receipt View
![Manager Invoice Receipt](public/screenshots/manager_invoice_receipt.png)
> **What is happening here:**
> - The Manager inspects an official customer tax receipt (`INV-B05A7660`) issued on `August 13, 2026 at 09:21 PM`.
> - Reviews customer billing details (*Walk-in Customer*), issuing cashier/terminal (`admin@bazaar.com`), payment channel (*Credit / Digital POS*), and total items fulfilled (10 units total).
> - Manager can print or export the receipt for customer returns, exchanges, or store audit verification.

---

## 👥 Role-Based User Testing Guide (Who Does What)

Bazaar enforces strict **Role-Based Access Control (RBAC)** across API endpoints and dashboard navigation. Use the credentials below to log in or use the top-right **"Simulate Role"** switcher in the sidebar to test each user perspective:

### 1. 🛡️ Admin User (`admin@bazaar.com` / `securepassword123`)
- **Full Access Level**: Unrestricted control across all store operations and settings.
- **What Admin CAN Do**:
  - ✅ View full financial analytics, revenue charts, top categories, and sales performance on the **Dashboard** (`/`).
  - ✅ Add, edit, update prices, and delete products in the **Product Catalog** (`/products`).
  - ✅ Monitor stock levels, track low-stock alerts, and perform manual stock adjustments in **Inventory** (`/inventory`).
  - ✅ Search, filter, view, print, and export all customer invoices in **Invoices** (`/invoices`).
  - ✅ Access deep financial profit-margin reports and analytics in **Reports** (`/reports`).
  - ✅ Process store checkout orders in the **POS Terminal** (`/pos`).

### 2. 👔 Store Manager User (`manager@bazaar.com` / `securepassword123`)
- **Operational Access Level**: Storefront and inventory management focus.
- **What Manager CAN Do**:
  - ✅ View high-level store sales dashboard (`/`).
  - ✅ Oversee stock quantities and perform stock level updates in **Inventory** (`/inventory`).
  - ✅ Search, review, print, and share customer invoices in **Invoices** (`/invoices`).
  - ✅ Ring up customer purchases in the **POS Terminal** (`/pos`).
- **What Manager CANNOT Do**:
  - ❌ Cannot edit or delete master product pricing & catalog metadata (`/products`).
  - ❌ Cannot access sensitive executive financial reports (`/reports`).

### 3. 🛒 Cashier User (`cashier@bazaar.com` / `securepassword123`)
- **Front-of-House Access Level**: Streamlined for fast checkout and customer service.
- **What Cashier CAN Do**:
  - ✅ Search product register by name or SKU and add items to cart.
  - ✅ Apply store discounts and register customer names/phones.
  - ✅ Process transactions and instantly print digital sales receipts or A4/Thermal tax invoices (`/pos`).
  - ✅ Look up past store customer receipts in **Invoices** (`/invoices`).
- **What Cashier CANNOT Do**:
  - ❌ Cannot view executive revenue dashboards (`/`).
  - ❌ Cannot add or edit master products (`/products`).
  - ❌ Cannot modify inventory quantities (`/inventory`).
  - ❌ Cannot access financial reports (`/reports`).

---

## 🛠️ Built With

- **Language:** TypeScript (End-to-end type safety)
- **Framework:** Next.js (App Router, Edge Middleware, Server Actions)
- **Database & ORM:** PostgreSQL + Drizzle ORM (PostgreSQL RLS for Tenant Data Isolation)
- **Authentication:** JWT Authentication & Custom Web Crypto Edge Middleware
- **Styling & UI:** Vanilla CSS Modules, Modern Typography (`Inter` & `Instrument Serif`), Dark/Light Mode, Glassmorphic Design System, and `@media print` CSS engine.

---

## ✨ Core Features

- 📜 **Printable & Downloadable Invoices:** High-fidelity invoice card template supporting A4 paper printing and 80mm thermal receipt formats with store logo, tax breakdown, and barcode verification.
- 🛒 **Offline-First POS Terminal:** Ultra-fast checkout terminal supporting instant item search, quantity adjustments, customer CRM tags, discount calculations, and shift totals.
- 🔒 **Database-Level Multi-Tenancy:** Strict tenant data separation using PostgreSQL session-scoped Row-Level Security (RLS). A tenant's store data can never bleed into another store.
- 📊 **Executive Analytics & Reports:** Real-time revenue tracking, category breakdowns, average order values, and inventory valuation metrics.
- 📱 **Cross-Device Responsiveness:** Engineered to look stunning on Mac/Desktop, iPad/Tablet, and iPhone/Android mobile viewports.

---

## 🚀 Getting Started

Follow these steps to get a local copy of Bazaar up and running on your machine.

### Prerequisites

Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- [npm](https://npmjs.com) or `yarn` / `pnpm`

### Installation & Run Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maliha-mobassira/bazaar.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd bazaar
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@ep-cool-db.neon.tech/bazaar?sslmode=require
   JWT_SECRET=supersecretkey123
   ```

5. **Seed Test Database & Credentials:**
   Start the dev server and visit `http://localhost:3000/api/debug/reset` in your browser to seed test products, store tenants, and default user accounts (`admin@bazaar.com` & `cashier@bazaar.com`).

6. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

## 🧠 What I Learned

- Built an **Offline-First POS & Retail SaaS** architecture utilizing Next.js App Router and TypeScript.
- Implemented **PostgreSQL Row-Level Security (RLS)** to enforce multi-tenant isolation at the database tier.
- Designed a custom **Web Crypto API JWT authentication middleware** running in Edge runtime.
- Created a **responsive `@media print` CSS engine** to render crisp A4 tax invoices and 80mm thermal receipts across desktop, tablet, and mobile screens.

---

## 📬 Contact

- **Maliha Mobassira** - [GitHub Profile](https://github.com/maliha-mobassira)
- **Project Repository:** [https://github.com/maliha-mobassira/bazaar](https://github.com/maliha-mobassira/bazaar)
