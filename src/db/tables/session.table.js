import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import timestampColumns from "../models/timestamp-columns.model";
import UserTable from "./user.table";

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
