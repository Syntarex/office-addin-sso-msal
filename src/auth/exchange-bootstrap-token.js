import { OAuth2Tokens } from "arctic";
import { ENTRA_APP_ID } from "astro:env/client";
import { ENTRA_APP_SECRET } from "astro:env/server";
import { scopes, tokenEndpoint } from "./auth.config";

/**
 * Exchanges a bootstrap token for graph tokens including refresh token and ID token
 * using the OAuth 2.0 On-Behalf-Of (OBO) flow.
 *
 * @param bootstrapToken - The bootstrap token obtained from Office SSO or MSAL
 */
export async function exchangeBootstrapToken(bootstrapToken) {
    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("client_id", ENTRA_APP_ID);
    params.append("client_secret", ENTRA_APP_SECRET);
    params.append("assertion", bootstrapToken);
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
        console.error("SSO token exchange error", errorText);
        throw new Error(`Failed to exchange SSO token: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();

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
