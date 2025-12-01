import { microsoftEntra } from "@/auth/auth.config";
import { ensureUserExists } from "@/auth/lib/ensure-user-exists";
import { createSession } from "@/auth/lib/handle-session";
import { setSessionTokenCookie } from "@/auth/lib/handle-session-cookie";
import { encryptSessionToken, generateSessionToken } from "@/auth/lib/handle-session-token";
import { decodeIdToken, type OAuth2Tokens } from "arctic";
import type { APIRoute } from "astro";
import { isString } from "radash";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    // Get params send over by Microsoft Entra
    const code = context.url.searchParams.get("code");
    const state = context.url.searchParams.get("state");

    // Get cookies which were saved before redirecting to Microsoft Entra
    const storedState = context.cookies.get("microsoft_entra_state")?.value ?? null;
    const storedCodeVerifier = context.cookies.get("microsoft_entra_code_verifier")?.value ?? null;

    // Check everything is present
    if (!code || !state || !storedState || !storedCodeVerifier) {
        return new Response(JSON.stringify({ error: "Missing required parameters" }), {
            status: 400,
        });
    }

    // Redeem code for tokens
    let tokens: OAuth2Tokens;
    try {
        tokens = await microsoftEntra.validateAuthorizationCode(code, storedCodeVerifier);
    } catch {
        return new Response(JSON.stringify({ error: "Failed to redeem code for tokens" }), {
            status: 400,
        });
    }

    // Get user information
    const claims = decodeIdToken(tokens.idToken());

    // Make sure the user got an id
    if (!("oid" in claims) || !isString(claims.oid)) {
        return new Response(JSON.stringify({ error: "Failed to get user information" }), {
            status: 400,
        });
    }

    // Create user if he doesn't already exist
    await ensureUserExists(claims.oid);

    // Create a session
    const sessionToken = generateSessionToken();
    const sessionId = encryptSessionToken(sessionToken);
    const session = await createSession(sessionId, claims.oid, tokens);

    // Set session to cookie
    setSessionTokenCookie(context, sessionToken, new Date(session.expiresAt));

    // Redirect user to home page
    return context.redirect("/");
};
