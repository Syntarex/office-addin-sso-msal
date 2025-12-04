import { accessTokenTreshold, scopes, sessionLifetime } from "@/auth/auth.config";
import type { Session } from "@/auth/models/session.model";
import type { User } from "@/auth/models/user.model";
import { db } from "@/db";
import { SessionTable, UserTable } from "@/db/db.schema";
import { MicrosoftEntraId, type OAuth2Tokens } from "arctic";
import { ENTRA_APP_ID, SITE_URL, TENANT_ID } from "astro:env/client";
import { ENTRA_APP_SECRET } from "astro:env/server";
import { eq } from "drizzle-orm";

/**
 * An `arctic` instance which helps interacting with Microsoft Entra ID.
 */
 const microsoftEntra = new MicrosoftEntraId(
    TENANT_ID,
    ENTRA_APP_ID,
    ENTRA_APP_SECRET,
    `https://${SITE_URL}/api/auth/callback`,
);

/**
 * This is the app's __main session handler__.
 *
 * Takes the id of a session and does a few things:
 * - Checks for the session to exist
 * - Validates the session to be active
 * - Refreshes session lifetime
 * - Refreshed access token (graph)
 * - Returns associated database items of session and user
 */
export async function validateSession(
    sessionId: string,
): Promise<{ session: Session; user: User } | { session: null; user: null }> {
    const [result] = await db
        .select()
        .from(SessionTable)
        .innerJoin(UserTable, eq(SessionTable.userId, UserTable.id))
        .where(eq(SessionTable.id, sessionId))
        .limit(1);

    // No session found
    if (!result) {
        return { session: null, user: null };
    }

    // Session expired
    if (Date.now() >= result.session.expiresAt) {
        await db.delete(SessionTable).where(eq(SessionTable.id, sessionId));

        return { session: null, user: null };
    }

    // Check or refresh the access token
    // Threshold of access token reached, so refresh the tokens
    // While updating the session anyway, we can also re-set the lifetime
    if (Date.now() >= result.session.accessTokenExpiresAt - accessTokenTreshold) {
        // Refresh tokens
        const msTokens = await microsoftEntra.refreshAccessToken(
            result.session.refreshToken,
            scopes,
        );

        if (!msTokens.hasRefreshToken()) {
            throw new Error(
                "Failed to read refresh token. Make sure your scopes include 'offline_access'.",
            );
        }

        // Update session
        const [updatedSession] = await db
            .update(SessionTable)
            .set({
                accessToken: msTokens.accessToken(),
                accessTokenExpiresAt: msTokens.accessTokenExpiresAt().getTime(),
                refreshToken: msTokens.refreshToken(),
                expiresAt: Date.now() + sessionLifetime,
            })
            .where(eq(SessionTable.id, sessionId))
            .returning();

        if (!updatedSession) {
            throw new Error("Failed to refresh access token.");
        }

        return { session: updatedSession, user: result.user };
    }

    return { session: result.session, user: result.user };
}

/**
 * Adds a session to the database.
 */
export async function createSession(
    sessionId: string,
    userId: string,
    msTokens: OAuth2Tokens,
): Promise<Session> {
    if (!msTokens.hasRefreshToken()) {
        throw new Error(
            "Failed to read refresh token. Make sure your scopes include 'offline_access'.",
        );
    }

    const session: typeof SessionTable.$inferInsert = {
        id: sessionId,
        userId,
        expiresAt: Date.now() + sessionLifetime,
        accessToken: msTokens.accessToken(),
        accessTokenExpiresAt: msTokens.accessTokenExpiresAt().getTime(),
        refreshToken: msTokens.refreshToken(),
    };

    // TODO: THIS IS BAD: https://github.com/tursodatabase/libsql/issues/2035
    const result = await db.insert(SessionTable).values(session).returning().get();

    if (!result) {
        throw new Error("Failed to create session.");
    }

    return result;
}

/**
 * Closes a specific session.
 * It's like signing a user out.
 */
export async function invalidateSession(sessionId: string): Promise<void> {
    await db.delete(SessionTable).where(eq(SessionTable.id, sessionId));
}

/**
 * Closes all sessions of a user.
 * It's like signing a user out on any of his devices.
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
    await db.delete(SessionTable).where(eq(SessionTable.userId, userId));
}
