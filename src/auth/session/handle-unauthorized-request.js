/**
 * Defines how the request is handled, if the user is unauthorized but tries to access a protected route.
 */
export async function handleUnauthorizedRequest(context) {
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
