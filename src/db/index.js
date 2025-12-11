import { createClient } from "@libsql/client/node";
import { DB_AUTH_TOKEN, DB_URL } from "astro:env/server";
import { drizzle } from "drizzle-orm/libsql";
import { SessionTable, UserTable } from "./db.schema";

const isLocalDatabase = DB_URL.startsWith("file:");

console.info(
    `Connecting to ${isLocalDatabase ? "local" : "remote"} database`,
);

export const connection = createClient({
    url: DB_URL,
    authToken: DB_AUTH_TOKEN,
});

/**
 * The primary database client of the app.
 */
export const db = drizzle(connection, {
    schema: {
        User: UserTable,
        Session: SessionTable,
    },
});

console.info("Database connected");
