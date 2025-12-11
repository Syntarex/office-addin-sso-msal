import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import timestampColumns from "../models/timestamp-columns.model";

export default sqliteTable(
    "user",
    {
        id: text().primaryKey(),
        ...timestampColumns,
    },
    () => [],
);
