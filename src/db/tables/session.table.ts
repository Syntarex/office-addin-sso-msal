import timestampColumns from "@/db/models/timestamp-columns.model";
import UserTable from "@/db/tables/user.table";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export default sqliteTable(
    "session",
    {
        id: text().primaryKey(),
        userId: text()
            .notNull()
            .references(() => UserTable.id, { onDelete: "cascade" }),
        expiresAt: integer().notNull(),
        accessToken: text().notNull(),
        accessTokenExpiresAt: integer().notNull(),
        refreshToken: text().notNull(),
        ...timestampColumns,
    },
    () => [],
);
