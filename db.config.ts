import type { Config } from "drizzle-kit";

/**
 * This file defines the `drizzle-kit` configuration.
 *
 * Use it to run migrations or generate type definitions.
 */

// `astro:env`'s context is not present, if this file is used by the `drizzle-kit` cli.
const DB_URL = process.env.DB_URL;
const DB_AUTH_TOKEN = process.env.DB_AUTH_TOKEN;

if (!DB_URL) {
    console.error("Missing environment variables.");
    process.exit(1);
}

export default {
    schema: "./src/db/db.schema.ts",
    out: "./src/db/migrations",
    dialect: "turso",
    dbCredentials: {
        url: DB_URL,
        authToken: DB_AUTH_TOKEN,
    },
} satisfies Config;
