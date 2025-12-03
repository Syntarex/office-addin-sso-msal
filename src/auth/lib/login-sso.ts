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
 * Exchanges an SSO token from Microsoft Office SDK for tokens with refresh token and ID token
 * using the OAuth 2.0 On-Behalf-Of (OBO) flow.
 *
 * @param token - The SSO token obtained from Microsoft Office SDK
 * @returns OAuth2Tokens instance from Arctic
 * @throws Error if the token exchange fails
 */
async function exchangeSSOTokenForTokens(token: string): Promise<OAuth2Tokens> {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("client_id", ENTRA_APP_ID);
    params.append("client_secret", ENTRA_APP_SECRET);
    params.append("assertion", token);
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
        console.error("SSO token exchange error:", errorText);
        throw new Error(`Failed to exchange SSO token: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json() as {
        access_token: string;
        refresh_token?: string;
        id_token?: string;
        expires_in: number;
    };

    if (!data.access_token) {
        throw new Error("No access token received from token exchange");
    }

    if (!data.refresh_token) {
        throw new Error("No refresh token received from token exchange. Make sure 'offline_access' scope is included.");
    }

    if (!data.id_token) {
        throw new Error("No ID token received from token exchange. Make sure 'openid' scope is included.");
    }

    // Create OAuth2Tokens instance from Arctic using the raw token response
    return new OAuth2Tokens(data);
}

/**
 * Handles SSO authentication and session creation following the callback.ts pattern.
 * This function performs the full authentication flow:
 * 1. Exchanges SSO token for tokens with refresh token and ID token
 * 2. Decodes ID token to get user information
 * 3. Ensures user exists
 * 4. Creates session
 * 5. Sets session cookie
 *
 * @param context - The API context for setting cookies
 * @param ssoToken - SSO token from Microsoft Office SDK
 * @returns The created session
 */
export async function handleSSOLogin(
    context: APIContext,
    ssoToken: string,
): Promise<Session> {
    // Exchange SSO token for tokens with refresh token and ID token
    const tokens = await exchangeSSOTokenForTokens(ssoToken);

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
