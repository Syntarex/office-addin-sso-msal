import { db } from "../../db";
import { UserTable } from "../../db/db.schema";

export async function ensureUserExists(userId) {
    await db.insert(UserTable).values({ id: userId }).onConflictDoNothing();
}
