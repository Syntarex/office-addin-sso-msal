import type { APIContext } from "astro";

/**
 * Renders an astro component which includes a `script`.
 * The scripts redirects the browser to the login page.
 * This is used as response body if an unauthorized user hits a protected server island.
 * This method is only used for the narrow use case of a user hitting a protected server island.
 * It's kinda weird but it works like a charm.
 */

/**
 * Defines how the request is handled, if the user is unauthorized but tries to access a protected route.
 */
export async function handleUnauthorizedRequest(context: APIContext): Promise<Response> {
    // The url which triggered the middleware
    const route = context.url.pathname;

    // User tries to access a protected api endpoint
    // Respond with Unauthorized
    if (route.startsWith("/api") || route.startsWith("/_server-islands")) {
        return new Response(null, { status: 401 });
    }

    // User tries to access a protected page
    // Redirect the user to the login page
    return context.redirect("/login");
}
