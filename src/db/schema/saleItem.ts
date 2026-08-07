import {
  pgTable,
  uuid,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { sales } from "./sale";
import { products } from "./product";
import { tenants } from "./tenant";

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),

  saleId: uuid("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),

  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  quantity: integer("quantity").notNull(),

  priceAtSale: numeric("price_at_sale", {
    precision: 10,
    scale: 2,
  }).notNull(),
});
