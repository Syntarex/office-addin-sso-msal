import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { validateSession } from "../../../auth/session/handle-session";
import { deleteSessionTokenCookie, setSessionTokenCookie } from "../../../auth/session/handle-session-cookie";

export const prerender = false;

export const GET = async (context) => {
    // Check for session cookie
    const token = context.cookies.get("session")?.value ?? null;
    if (!token) {
        return new Response(null, { status: 401 });
    }

    // Validate session
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const { session } = await validateSession(sessionId);

    // If session isn't present, delete the cookie
    if (!session) {
        deleteSessionTokenCookie(context);

        return new Response(null, { status: 401 });
    }

    // Re-set the cookie
    // The expiration might have changed
    setSessionTokenCookie(context, token, new Date(session.expiresAt));

    // Remove the refresh token from payload
    delete session.refreshToken;

    // Return session and user information
    return new Response(JSON.stringify(session), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
