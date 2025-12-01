import { ENTRA_APP_ID, ENTRA_APP_SECRET, TENANT_ID } from "astro:env/server";

/**
 * Exchanges an SSO token from Microsoft Office SDK for a Microsoft Graph access token
 * using the OAuth 2.0 On-Behalf-Of (OBO) flow.
 *
 * @param token - The SSO token obtained from Microsoft Office SDK
 * @returns The Microsoft Graph access token
 * @throws Error if the token exchange fails
 */
export async function exchangeSSOToken(token: string): Promise<string> {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("client_id", ENTRA_APP_ID);
    params.append("client_secret", ENTRA_APP_SECRET);
    params.append("assertion", token);
    params.append("scope", "https://graph.microsoft.com/.default");
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
        throw new Error(`Failed to exchange SSO token: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json() as { access_token: string };

    console.info("Exchange SSO Token", JSON.stringify(data));
    if (!data.access_token) {
        throw new Error("No access token received from token exchange");
    }

    return data.access_token;
}
