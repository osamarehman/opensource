import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for better compatibility
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Tenant-aware database connection
export class TenantDB {
  private client: postgres.Sql;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.client = postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  // Get database instance with tenant context
  async getDB() {
    // Set the tenant context for RLS policies
    await this.client`SELECT set_config('app.tenant_id', ${this.tenantId}, false)`;
    return drizzle(this.client, { schema });
  }

  // Close the connection
  async close() {
    await this.client.end();
  }
}

// Utility to create tenant-aware database connection
export function createTenantDB(tenantId: string) {
  return new TenantDB(tenantId);
}

// Export schema for use in other files
export * from "./schema";
export { schema };

// Helper to close the database connection
export const closeDb = async () => {
  await client.end();
};

// Type exports
export type Database = typeof db;
export type Schema = typeof schema;

// Helper to validate tenant access
export function validateTenantAccess(userTenantId: string, resourceTenantId: string) {
  if (userTenantId !== resourceTenantId) {
    throw new Error('Unauthorized: Access denied to tenant resource');
  }
}