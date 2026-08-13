import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { requireRole } from "@/lib/requireRole";
import { sales } from "@/db/schema/sale";
import { saleItems } from "@/db/schema/saleItem";
import { products } from "@/db/schema/product";
import { tenants } from "@/db/schema/tenant";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = requireRole(req, ["admin", "manager", "cashier"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: saleId } = await params;

  try {
    const result = await withTenant(tenantId, async (db) => {
      const tenantData = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .then((r) => r[0]);

      const sale = await db
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
        .where(eq(sales.id, saleId))
        .then((r) => r[0]);

      if (!sale) {
        return null;
      }

      const items = await db
        .select({
          productId: saleItems.productId,
          quantity: saleItems.quantity,
          priceAtSale: saleItems.priceAtSale,
          productName: products.name,
          sku: products.sku,
          category: products.category,
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(eq(saleItems.saleId, saleId));

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

    if (!result) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET Invoice Single Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
