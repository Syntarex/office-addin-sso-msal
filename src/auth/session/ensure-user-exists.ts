import { db } from "@/db";
import { UserTable } from "@/db/db.schema";

export async function ensureUserExists(userId: string): Promise<void> {
    await db.insert(UserTable).values({ id: userId }).onConflictDoNothing();
}
