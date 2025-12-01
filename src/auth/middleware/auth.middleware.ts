import { validateSession } from "@/auth/lib/handle-session";
import {
    deleteSessionTokenCookie,
    getSessionTokenFromCookie,
    setSessionTokenCookie,
} from "@/auth/lib/handle-session-cookie";
import { encryptSessionToken } from "@/auth/lib/handle-session-token";
import { handleUnauthorizedRequest } from "@/auth/lib/handle-unauthorized-request";
import { defineMiddleware } from "astro:middleware";

/**
 * Defines which routes aren't protected.
 * Be aware that this includes sub-routes.
 */
const unprotectedRoutes: string[] = ["/api/auth"];

export default defineMiddleware(async (context, next) => {
    // No need to protect static content
    if (context.isPrerendered) {
        return next();
    }

    // We don't need to protect every route
    const route = context.url.pathname;
    for (const unprotectedRoute of unprotectedRoutes) {
        if (route.startsWith(unprotectedRoute)) {
            return next();
        }
    }

    // Get the user's session token
    const token = getSessionTokenFromCookie(context);

    // No session token found, so let's redirect the user to the login page
    if (!token) {
        return handleUnauthorizedRequest(context);
    }

    // Validate user's session
    const sessionId = encryptSessionToken(token);
    const { session } = await validateSession(sessionId);

    // No session found, so let's delete the faulty token
    if (!session) {
        deleteSessionTokenCookie(context);
        return handleUnauthorizedRequest(context);
    }

    // Re-set the cookie
    // The expiration might have changed
    setSessionTokenCookie(context, token, new Date(session.expiresAt));

    // Set user session
    context.locals.session = session;

    return next();
});
