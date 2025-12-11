/**
 * This file defines the `drizzle-kit` configuration.
 *
 * Use it to run migrations or generate type definitions.
 */

const DB_URL = process.env.DB_URL;
const DB_AUTH_TOKEN = process.env.DB_AUTH_TOKEN;

if (!DB_URL) {
    console.error("Missing environment variables.");
    process.exit(1);
}

export default {
    schema: "./src/db/db.schema.js",
    out: "./src/db/migrations",
    dialect: "turso",
    dbCredentials: {
        url: DB_URL,
        authToken: DB_AUTH_TOKEN,
    },
};
