import { scopes } from "@/auth/auth.config";
import { ensureUserExists } from "@/auth/lib/ensure-user-exists";
import { createSession } from "@/auth/lib/handle-session";
import { setSessionTokenCookie } from "@/auth/lib/handle-session-cookie";
import { encryptSessionToken, generateSessionToken } from "@/auth/lib/handle-session-token";
import type { Session } from "@/auth/models/session.model";
import { decodeIdToken, OAuth2Tokens } from "arctic";
import type { APIContext } from "astro";
import { ENTRA_APP_ID, TENANT_ID } from "astro:env/client";
import { ENTRA_APP_SECRET } from "astro:env/server";
import { isString } from "radash";

/**
 * Exchanges MSAL access token for tokens with refresh token using OAuth2 token exchange.
 * This allows us to get a refresh token that can be stored in the session.
 *
 * @param msalAccessToken - MSAL access token
 * @param idToken - MSAL ID token (to include in the response)
 * @returns OAuth2Tokens instance from Arctic
 */
async function exchangeMSALTokenForRefreshToken(
    msalAccessToken: string,
    idToken: string,
): Promise<OAuth2Tokens> {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("client_id", ENTRA_APP_ID);
    params.append("client_secret", ENTRA_APP_SECRET);
    params.append("assertion", msalAccessToken);
    params.append("scope", scopes.join(" "));
    params.append("requested_token_use", "on_behalf_of");

    const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to exchange MSAL token: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    };

    if (!data.access_token) {
        throw new Error("No access token received from token exchange");
    }

    if (!data.refresh_token) {
        throw new Error("No refresh token received from token exchange. Make sure 'offline_access' scope is included.");
    }

    // Include the ID token in the response data
    const tokenData = {
        ...data,
        id_token: idToken,
    };

    // Create OAuth2Tokens instance from Arctic using the raw token response
    return new OAuth2Tokens(tokenData);
}

/**
 * Handles MSAL authentication and session creation following the callback.ts pattern.
 * This function performs the full authentication flow:
 * 1. Exchanges MSAL tokens for OAuth2Tokens with refresh token
 * 2. Decodes ID token to get user information
 * 3. Ensures user exists
 * 4. Creates session
 * 5. Sets session cookie
 *
 * @param context - The API context for setting cookies
 * @param accessToken - MSAL access token
 * @param idToken - MSAL ID token
 * @returns The created session
 */
export async function handleMSALLogin(
    context: APIContext,
    accessToken: string,
    idToken: string,
): Promise<Session> {
    // Exchange MSAL access token for tokens with refresh token
    const tokens = await exchangeMSALTokenForRefreshToken(accessToken, idToken);

    // Get user information from ID token
    const claims = decodeIdToken(tokens.idToken());

    // Make sure the user has an ID
    if (!("oid" in claims) || !isString(claims.oid)) {
        throw new Error("Failed to get user information from ID token");
    }

    // Create user if they don't already exist
    await ensureUserExists(claims.oid);

    // Create a session
    const sessionToken = generateSessionToken();
    const sessionId = encryptSessionToken(sessionToken);
    const session = await createSession(sessionId, claims.oid, tokens);

    // Set session cookie
    setSessionTokenCookie(context, sessionToken, new Date(session.expiresAt));

    return session;
}
