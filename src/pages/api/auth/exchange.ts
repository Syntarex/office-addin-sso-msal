import { exchangeSSOToken } from "@/auth/lib/exchange-sso-token";
import type { APIRoute } from "astro";

export const prerender = false;

// TODO: Add token validation!
// https://learn.microsoft.com/en-us/office/dev/add-ins/develop/sso-in-office-add-ins?tabs=xmlmanifest#validate-the-access-token
export const POST: APIRoute = async ({ request }) => {
    // Get the SSO token from the request body
    const { token } = await request.json();

    // Check if the SSO token is present
    if (!token) {
        return new Response(JSON.stringify({ error: "Missing required attribute 'token' in body." }), {
            status: 400,
        });
    }

    try {
        // Exchange the SSO token for a Graph token
        const graphToken = await exchangeSSOToken(token);

        return new Response(JSON.stringify({
            accessToken: graphToken,
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to exchange token";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
