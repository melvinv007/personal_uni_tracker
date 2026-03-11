/**
 * Drizzle ORM Configuration
 *
 * Purpose: Configures Drizzle Kit for schema migrations and database introspection.
 * Uses PostgreSQL via Supabase.
 *
 * Reference: PRD Section 7.1 (ORM & Migrations), Section 26.1 (Migration Strategy)
 */
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
