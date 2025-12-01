import type { UserTable } from "@/db/db.schema";

export type User = typeof UserTable.$inferSelect;
