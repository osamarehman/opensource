import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from "./schema";
export { schema };

// Helper to close the database connection
export const closeDb = async () => {
  await client.end();
};