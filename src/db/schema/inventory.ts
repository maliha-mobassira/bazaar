import {
  pgTable,
  uuid,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant";
import { products } from "./product";

export const inventory = pgTable("inventory", {
  id: uuid("id").defaultRandom().primaryKey(),

  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),

  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  quantity: integer("quantity").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
