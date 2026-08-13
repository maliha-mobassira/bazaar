import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { sales } from "@/db/schema/sale";
import { saleItems } from "@/db/schema/saleItem";
import { products } from "@/db/schema/product";
import { tenants } from "@/db/schema/tenant";
import { users } from "@/db/schema/user";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const roleCheck = requireRole(req, ["admin", "manager", "cashier"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";

  try {
    const result = await withTenant(tenantId, async (db) => {
      // Fetch tenant information
      const tenantData = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .then((r) => r[0]);

      // Fetch sales
      const salesList = await db
        .select({
          id: sales.id,
          totalAmount: sales.totalAmount,
          discountAmount: sales.discountAmount,
          customerName: sales.customerName,
          customerPhone: sales.customerPhone,
          createdAt: sales.createdAt,
          userId: sales.userId,
          cashierEmail: users.email,
        })
        .from(sales)
        .leftJoin(users, eq(sales.userId, users.id))
        .where(eq(sales.tenantId, tenantId))
        .orderBy(desc(sales.createdAt));

      // Fetch all sale items with product info
      const allItems = await db
        .select({
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          priceAtSale: saleItems.priceAtSale,
          productName: products.name,
          sku: products.sku,
          category: products.category,
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.tenantId, tenantId));

      // Group items by saleId
      const itemsBySale = new Map<string, typeof allItems>();
      allItems.forEach((item) => {
        const existing = itemsBySale.get(item.saleId) || [];
        existing.push(item);
        itemsBySale.set(item.saleId, existing);
      });

      // Map formatted invoices
      let invoices = salesList.map((sale) => {
        const items = itemsBySale.get(sale.id) || [];
        const formattedItems = items.map((i) => ({
          productId: i.productId,
          name: i.productName,
          sku: i.sku,
          category: i.category,
          quantity: i.quantity,
          unitPrice: Number(i.priceAtSale),
          lineTotal: Number(i.priceAtSale) * i.quantity,
        }));

        const subtotal = formattedItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const discount = Number(sale.discountAmount || 0);
        const total = Number(sale.totalAmount);
        const itemCount = formattedItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          id: sale.id,
          invoiceNumber: `INV-${sale.id.slice(0, 8).toUpperCase()}`,
          createdAt: sale.createdAt.toISOString(),
          customerName: sale.customerName || "Walk-in Customer",
          customerPhone: sale.customerPhone || "N/A",
          cashierEmail: sale.cashierEmail || "Store Cashier",
          subtotal: subtotal.toFixed(2),
          discountAmount: discount.toFixed(2),
          totalAmount: total.toFixed(2),
          itemCount,
          items: formattedItems,
          storeName: tenantData?.name || "Bazaar Retail Store",
          status: "Paid",
        };
      });

      if (search) {
        const q = search.toLowerCase();
        invoices = invoices.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.customerPhone.toLowerCase().includes(q) ||
            inv.id.toLowerCase().includes(q)
        );
      }

      return invoices;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
