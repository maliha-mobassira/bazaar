import {
  pgTable,
  uuid,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant";
import { users } from "./user";

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),

  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "set null" }),

  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
