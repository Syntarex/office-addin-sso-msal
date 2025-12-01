import type { SessionTable } from "@/db/db.schema";

export type Session = typeof SessionTable.$inferSelect;
