import { handleSSOLogin } from "@/auth/lib/login-sso";
import type { APIRoute } from "astro";
import { omit } from "radash";

export const prerender = false;

// TODO: Add token validation!
// https://learn.microsoft.com/en-us/office/dev/add-ins/develop/sso-in-office-add-ins?tabs=xmlmanifest#validate-the-access-token
/**
 * API endpoint to handle SSO authentication.
 * Follows the same pattern as callback.ts for session handling.
 */
export const POST: APIRoute = async (context) => {
    // Get the SSO token from the request body
    const { token } = await context.request.json();

    // Check if the SSO token is present
    if (!token) {
        return new Response(JSON.stringify({ error: "Missing required attribute 'token' in body." }), {
            status: 400,
        });
    }

    // Handle SSO login (exchanges token, creates user, creates session, sets cookie)
    let session;
    try {
        session = await handleSSOLogin(context, token);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to exchange token";
        console.error("SSO authentication error:", error);
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
