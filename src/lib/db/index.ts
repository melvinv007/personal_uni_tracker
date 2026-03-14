/**
 * Database Connection — Drizzle ORM
 *
 * Purpose: Creates a singleton Drizzle ORM instance connected to Supabase PostgreSQL.
 * Used by all API routes for type-safe database queries.
 *
 * Reference: PRD Section 7.1 (ORM & Migrations)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * PostgreSQL connection using the postgres.js driver.
 * Connection pooling is handled by the driver.
 */
const connectionString = process.env.DATABASE_URL!;

/* Use connection pooling in production, direct connection in development */
const client = postgres(connectionString, {
  max: 1,
  prepare: false,
});

/**
 * Drizzle ORM instance with full schema type inference.
 * All queries go through this instance.
 */
export const db = drizzle(client, { schema });
