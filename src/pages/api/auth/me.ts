import { validateSession } from "@/auth/lib/handle-session";
import { deleteSessionTokenCookie, setSessionTokenCookie } from "@/auth/lib/handle-session-cookie";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import type { APIRoute } from "astro";
import { omit } from "radash";

export const prerender = false;

export const GET: APIRoute = async (context) => {
    // Check for session cookie
    const token = context.cookies.get("session")?.value ?? null;
    if (!token) {
        return new Response(null, { status: 401 });
    }

    // Validate session
    const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
    const { session, user } = await validateSession(sessionId);

    // If session isn't present, delete the cookie
    if (!session) {
        deleteSessionTokenCookie(context);

        return new Response(null, { status: 401 });
    }

    // Re-set the cookie
    // The expiration might have changed
    setSessionTokenCookie(context, token, new Date(session.expiresAt));

    // Remove the refresh token from payload
    const sanitizedSession = omit(session, ["refreshToken"]);

    // Return session and user information
    return new Response(JSON.stringify({ session: sanitizedSession, user }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
