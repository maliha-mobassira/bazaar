import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenant";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),

  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  role: text("role").notNull(), // admin, manager, cashier

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
