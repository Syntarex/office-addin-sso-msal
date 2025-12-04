import { ensureUserExists } from "@/auth/session/ensure-user-exists";
import { exchangeBootstrapToken } from "@/auth/session/exchange-bootstrap-token";
import { createSession } from "@/auth/session/handle-session";
import { setSessionTokenCookie } from "@/auth/session/handle-session-cookie";
import { encryptSessionToken, generateSessionToken } from "@/auth/session/handle-session-token";
import { decodeIdToken } from "arctic";
import type { APIRoute } from "astro";
import { isString, omit } from "radash";

export const prerender = false;

// TODO: Add token validation!
// https://learn.microsoft.com/en-us/office/dev/add-ins/develop/sso-in-office-add-ins?tabs=xmlmanifest#validate-the-access-token
/**
 * API endpoint to handle SSO authentication.
 * Follows the same pattern as callback.ts for session handling.
 */
export const POST: APIRoute = async (context) => {
    // Get the SSO token from the request body
    const { bootstrapToken } = await context.request.json();

    // Check if the SSO token is present
    if (!bootstrapToken) {
        return new Response(JSON.stringify({ error: "Missing required attribute 'token' in body." }), {
            status: 400,
        });
    }

    try {
        // Exchange SSO token for tokens with refresh token and ID token
        const tokens = await exchangeBootstrapToken(bootstrapToken);

        // Get user information from ID token
        const claims = decodeIdToken(tokens.idToken());

        // Make sure the user has an ID
        if (!("oid" in claims) || !isString(claims.oid)) {
            throw new Error("Failed to get user information from ID token");
        }

        // Create user if they don't already exist
        await ensureUserExists(claims.oid);

        // Create a session
        const sessionToken = generateSessionToken();
        const sessionId = encryptSessionToken(sessionToken);
        const session = await createSession(sessionId, claims.oid, tokens);

        // Set session cookie
        setSessionTokenCookie(context, sessionToken, new Date(session.expiresAt));

        // Return session (without refresh token for security)
        const sanitizedSession = omit(session, ["refreshToken"]);

        return new Response(JSON.stringify(sanitizedSession), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to exchange token";
        console.error("SSO authentication error:", error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
        });
    }


};
