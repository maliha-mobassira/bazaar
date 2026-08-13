# Bazaar 🚀 - Production-Grade Multi-Tenant Retail POS & Management SaaS Platform

Bazaar is a production-ready, offline-first Point of Sale (POS) and Multi-Tenant Retail Management SaaS platform built to empower retail stores, multi-branch chains, and SMEs with real-time stock control, printable tax invoices, sales analytics, and strict database-level multi-tenancy.

[🔗 **Live Demo Application**](https://bazaar-pfjm.onrender.com)

---

## 🔑 Quick Login Credentials (Role-Based Access)

Test the live application or your local environment using any of the seeded user roles below:

| Role | Email Address | Password | Allowed Access | Restricted Areas |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@bazaar.com` | `securepassword123` | Full System Access (All pages) | *None* |
| **👔 Manager** | `manager@bazaar.com` | `securepassword123` | Dashboard, Inventory, Invoices, POS | Product Editing, Financial Reports |
| **🛒 Cashier** | `cashier@bazaar.com` | `securepassword123` | POS Terminal, Invoices Search | Dashboard, Product Editing, Inventory, Reports |

---

## 📸 Role-Based Visual Walkthrough

### 🛡️ Admin Role Showcase (`admin@bazaar.com`)

| 1. System Control Center (Initial State) | 2. Real-Time Dashboard Update (Post-Checkout) |
| :---: | :---: |
| <img src="public/screenshots/admin_dashboard_initial.png" width="480" alt="Admin Dashboard Initial" /> | <img src="public/screenshots/admin_dashboard_active.png" width="480" alt="Admin Dashboard Active" /> |
| *Displays real-time revenue ($0.00), stock health (92%), and low-stock alert badges prior to orders.* | *Dynamically updates revenue to **$1,182.46**, logs live checkout transactions and PostgreSQL transaction UUIDs.* |

| 3. POS Checkout Register | 4. Business Intelligence Reports |
| :---: | :---: |
| <img src="public/screenshots/admin_pos_checkout.png" width="480" alt="Admin POS Checkout" /> | <img src="public/screenshots/admin_reports.png" width="480" alt="Admin Reports" /> |
| *Product catalog register grid with stock pills and 10-item order cart totaling **$1,182.46**.* | *Revenue performance graphs, category breakdown (Groceries 35%, Electronics 28%), and top product sales rankings.* |

| 5. Enterprise Invoices & Tax Receipts Hub |
| :---: |
| <img src="public/screenshots/admin_invoices.png" width="560" alt="Admin Invoices" /> |
| *Invoices dashboard featuring stat cards, search filters, and triggers for printable A4 / 80mm thermal receipts.* |

---

### 👔 Manager Role Showcase (`manager@bazaar.com`)

| 1. Manager Control Center (`ROLE: MANAGER`) | 2. Customer Tax Invoice Receipt Detail |
| :---: | :---: |
| <img src="public/screenshots/manager_dashboard.png" width="480" alt="Manager Dashboard" /> | <img src="public/screenshots/manager_invoice_receipt.png" width="480" alt="Manager Tax Receipt" /> |
| *Shows `ROLE: MANAGER` sidebar access (Products & Reports hidden; Manage Catalog disabled).* | *Customer tax invoice modal (`INV-B05A7660`) displaying billing metadata, cashier ID, and line item counts.* |

---

### 🛒 Cashier Role Showcase (`cashier@bazaar.com`)

| Cashier Front-of-House POS Terminal (`ROLE: CASHIER`) |
| :---: |
| <img src="public/screenshots/cashier_pos_terminal.png" width="560" alt="Cashier POS Terminal" /> |
| *Front-of-house register (`ROLE: CASHIER`). Automatically routed directly to checkout terminal (`/pos`) for fast order processing, item searching, and receipt issuance.* |

---

## 👥 Role-Based Access Control (RBAC Breakdown)

Bazaar enforces database and middleware level **Role-Based Access Control (RBAC)**:

1. **🛡️ Admin User (`admin@bazaar.com`)**:
   - ✅ View full financial analytics and sales performance on **Dashboard** (`/`).
   - ✅ Add, edit, and delete items in **Product Catalog** (`/products`).
   - ✅ Monitor stock levels and perform manual inventory adjustments in **Inventory** (`/inventory`).
   - ✅ Search, filter, print, and export all receipts in **Invoices** (`/invoices`).
   - ✅ Access profit-margin analytics in **Reports** (`/reports`).
   - ✅ Process sales in **POS Terminal** (`/pos`).

2. **👔 Store Manager User (`manager@bazaar.com`)**:
   - ✅ View high-level store sales dashboard (`/`).
   - ✅ Oversee stock quantities in **Inventory** (`/inventory`).
   - ✅ Search and print customer tax receipts in **Invoices** (`/invoices`).
   - ✅ Ring up customer purchases in **POS Terminal** (`/pos`).
   - ❌ *Restricted*: Cannot edit master catalog prices (`/products`) or access financial reports (`/reports`).

3. **🛒 Cashier User (`cashier@bazaar.com`)**:
   - ✅ Search product register, add items to cart, and apply store discounts (`/pos`).
   - ✅ Process transactions and print A4 / 80mm thermal receipts (`/pos`).
   - ✅ Look up past customer store receipts in **Invoices** (`/invoices`).
   - ❌ *Restricted*: Automatically redirected away from executive dashboards, product editing, stock overrides, and financial reports.

---

## 🛠️ Built With

- **Language:** TypeScript (End-to-end type safety)
- **Framework:** Next.js (App Router, Edge Middleware, Server Actions)
- **Database & ORM:** PostgreSQL + Drizzle ORM (PostgreSQL RLS for Tenant Isolation)
- **Authentication:** JWT Authentication & Web Crypto Edge Middleware
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

- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- [npm](https://npmjs.com) or `yarn` / `pnpm`

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maliha-mobassira/bazaar.git
   cd bazaar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@ep-cool-db.neon.tech/bazaar?sslmode=require
   JWT_SECRET=supersecretkey123
   ```

4. **Seed Test Database & User Accounts:**
   Start the dev server and visit `http://localhost:3000/api/debug/reset` in your browser to seed test products, store tenants, and default user accounts (`admin@bazaar.com` & `cashier@bazaar.com`).

5. **Start local development server:**
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
- **Live Application:** [https://bazaar-pfjm.onrender.com](https://bazaar-pfjm.onrender.com)
- **Project Repository:** [https://github.com/maliha-mobassira/bazaar](https://github.com/maliha-mobassira/bazaar)
