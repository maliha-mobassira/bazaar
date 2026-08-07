import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenant";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),

  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),

  name: text("name").notNull(),
  sku: text("sku").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
