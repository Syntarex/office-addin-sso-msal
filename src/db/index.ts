import { SessionTable, UserTable } from "@/db/db.schema";
import { createClient } from "@libsql/client/node";
import { DB_AUTH_TOKEN, DB_REPLICA_PATH, DB_REPLICA_SYNC_INTERVAL, DB_URL } from "astro:env/server";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

// Enables the "Embedded Replica" feature of libsql
// https://docs.turso.tech/features/embedded-replicas/introduction
const localSync = !!DB_REPLICA_PATH;

console.info(
    `Connecting to ${localSync || DB_URL.startsWith("file:") ? "local" : "remote"} database`,
);

export const connection = createClient({
    url: localSync ? `file:${DB_REPLICA_PATH}` : DB_URL,
    authToken: DB_AUTH_TOKEN,
    syncUrl: localSync ? DB_URL : undefined,
    syncInterval: localSync ? DB_REPLICA_SYNC_INTERVAL : undefined,
});

if (localSync) {
    console.info("Syncing database");
    await connection.sync();
}

export type DB = LibSQLDatabase<{
    User: typeof UserTable;
    Session: typeof SessionTable;
}>;

/**
 * The primary database client of the app.
 */
export const db: DB = drizzle(connection, {
    schema: {
        User: UserTable,
        Session: SessionTable,
    },
});

console.info("Database connected");
