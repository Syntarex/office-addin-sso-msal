import { sql } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";

const timestampColumns = {
    createdAt: text()
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text()
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`)
        .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
};

export default timestampColumns;
