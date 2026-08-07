import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// ✅ helper to set tenant context
export async function withTenant<T>(
  tenantId: string,
  callback: (tx: NodePgDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    // Set PostgreSQL session variable for RLS
    await client.query(`SET app.tenant_id = '${tenantId}'`);

    const tenantDb = drizzle(client, { schema });

    return await callback(tenantDb);
  } finally {
    client.release();
  }
}