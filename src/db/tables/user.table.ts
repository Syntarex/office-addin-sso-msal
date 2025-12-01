import timestampColumns from "@/db/models/timestamp-columns.model";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export default sqliteTable(
    "user",
    {
        id: text().primaryKey(),
        ...timestampColumns,
    },
    () => [],
);
