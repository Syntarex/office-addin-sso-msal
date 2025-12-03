import { handleMSALLogin } from "@/auth/lib/login-msal";
import type { APIRoute } from "astro";
import { omit } from "radash";

export const prerender = false;

/**
 * API endpoint to handle MSAL authentication fallback.
 * Follows the same pattern as callback.ts for session handling.
 */
export const POST: APIRoute = async (context) => {
    // Get MSAL tokens from request body
    const body = await context.request.json();
    const { accessToken, idToken } = body;

    // Check if tokens are present
    if (!accessToken || !idToken) {
        return new Response(JSON.stringify({ error: "Missing required fields: accessToken and idToken are required" }), {
            status: 400,
        });
    }

    // Handle MSAL login (exchanges tokens, creates user, creates session, sets cookie)
    let session;
    try {
        session = await handleMSALLogin(context, accessToken, idToken);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create session from MSAL tokens";
        console.error("MSAL authentication error:", error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
        });
    }

    // Return session (without refresh token for security)
    const sanitizedSession = omit(session, ["refreshToken"]);

    return new Response(JSON.stringify(sanitizedSession), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
};
