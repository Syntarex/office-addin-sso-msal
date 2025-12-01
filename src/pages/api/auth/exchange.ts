import { exchangeSSOToken } from "@/auth/lib/exchange-sso-token";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    // Get the SSO token from the request body
    const { token } = await request.json();

    // Check if the SSO token is present
    if (!token) {
        return new Response(JSON.stringify({ error: "Missing required attribute 'token' in body." }), {
            status: 400,
        });
    }

    // Exchange the SSO token for a Graph token
    const graphToken = exchangeSSOToken(token);

    return new Response(JSON.stringify({
        accessToken: graphToken,
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });

};
