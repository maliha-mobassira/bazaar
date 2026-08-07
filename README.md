This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




















<!-- A Production-Grade Multi-Tenant Retail POS & Retail Management SaaS Platform.

---

## Bazaar in Simple Terms (What & Why)

If these technical terms sound complicated, here is a simple way to understand and explain Bazaar:

### 1. The Core Concept (Using an Apartment Analogy)
*   **SaaS (Software as a Service)**: Instead of building your own house (buying servers and hiring IT staff), you **rent a beautiful apartment**. We maintain the building (updates, security, database), and you just pay a monthly fee to use it.
*   **Multi-Tenant**: Like families living in the same apartment building, **many different businesses use Bazaar**. They share the same underlying structure (servers/code), but each business has its own private, locked apartment. A grocery shop using Bazaar can *never* see the sales, stock, or customers of a clothing boutique using the same platform.
*   **POS (Point of Sale)**: This is simply the **digital cash register** at the store counter where sales are rung up, barcodes are scanned, and receipts are printed.
*   **Retail Management**: A central dashboard to control inventories, products, and employee schedules.

### 2. A Real-World Example
Imagine **Mr. Rahman**, who owns a chain of 3 grocery shops.
*   **Before Bazaar**: If the internet goes down, checkout lines stop. If he wants to check how much milk is left, he has to call three different managers. He also had to buy expensive computers and hire IT guys to set up database servers.
*   **With Bazaar**:
    *   He opens a web browser on any normal tablet or laptop and logs in.
    *   Even if the internet fails in one store, the cash counter **keeps selling** (Offline-First).
    *   He can sit at home and instantly see the stock and sales of all 3 shops in real-time.
    *   No expensive servers, no IT staff needed.

---

## Product Vision & Business Context

### 1. What We Are Building
Bazaar is an all-in-one Retail Management and Point of Sale (POS) SaaS platform. It consists of:
*   **Offline-First POS**: A fast checkout terminal that works offline and synchronizes data with the cloud once the network is restored.
*   **Multi-Store Inventory Management**: Real-time inventory tracking, transfers, and alerts across multiple branches/warehouses.
*   **Advanced Analytics & Reporting**: Sales performance, profit margins, and predictive inventory needs.
*   **Customer Relationship Management (CRM)**: Customer loyalty programs, purchase history tracking, and marketing tools.
*   **Employee Management**: Role-based access control (RBAC), shift logs, and performance tracking.

### 2. Who It Is For (Target Audience)
*   **Small to Medium Enterprises (SMEs)**: Independent grocery stores, boutique clothing shops, pharmacies, and specialty retailers.
*   **Multi-Branch Retail Chains**: Businesses requiring centralized management for multiple physical locations.
*   **Franchise Operations**: Brands that need isolated data management per franchise while maintaining parent-company oversight.

### 3. Cost-Reducing Benefits
*   **Preventing Lost Revenue**: The offline-first design guarantees that network outages do not disrupt sales.
*   **Reduced Hardware Expenses**: Runs directly inside any modern web browser on standard tablets, laptops, or mobile phones, removing the need for proprietary POS hardware.
*   **Inventory Optimization**: Prevents capital lockup by identifying dead stock and reduces waste by alerting managers to expiring inventory.
*   **Lower IT/Maintenance Costs**: Cloud-hosted SaaS architecture eliminates the need for on-premise servers, local database backups, and dedicated IT maintenance staff.

### 4. Why People Should Choose Bazaar (Key Differentiators)
*   **Uncompromised Data Privacy**: Built with PostgreSQL Row-Level Security (RLS) ensuring strict tenant isolation; a tenant's data can never bleed into another.
*   **High Performance**: Next.js App Router and light Vanilla CSS Modules ensure instant loading and zero lag during peak checkout hours.
*   **Seamless Scaling**: Businesses can start with one cash register in one shop and expand to hundreds of locations without changing their software stack.

---

## Architectural Principles

1. **Multi-Tenancy**: Data isolation at the database level using PostgreSQL Row-Level Security (RLS) to ensure that tenant data remains strictly segregated.
2. **Modular Architecture**: Codebase organized by domains/features (e.g., Inventory, POS, Analytics) rather than technical layers alone. This maximizes maintainability and limits coupling.
3. **Offline-First POS**: Point of sale operations utilize local storage synchronization to ensure storefronts remain operational during network interruptions.
4. **Type Safety**: End-to-end type safety using TypeScript from the database schema down to the user interface.

## Tech Stack (Proposed)

* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Database**: PostgreSQL
* **ORM**: Drizzle ORM
* **Styling**: Vanilla CSS with CSS Modules for clean, performant styling
* **State Management**: React Context & local browser storage (IndexedDB) for offline POS operations

 -->
