import { scopes } from "@/auth/auth.config";
import type { Session } from "@/auth/models/session.model";
import { PublicClientApplication, type AuthenticationResult } from "@azure/msal-browser";
import { ENTRA_APP_ID, TENANT_ID } from "astro:env/client";

// MSAL configuration
const msalConfig = {
    auth: {
        clientId: ENTRA_APP_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: window.location.origin,
    },
};

// Initialize MSAL instance (singleton pattern)
let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
    }
    return msalInstance;
}

/**
 * Authenticates using MSAL as a fallback when SSO fails.
 */
async function loginWithMSAL(): Promise<Session> {
    const msal = getMsalInstance();

    // Initialize MSAL
    await msal.initialize();

    try {
        // Try to get account from cache first
        const accounts = msal.getAllAccounts();
        let account = accounts[0];
        let authResult: AuthenticationResult | null = null;

        // If we have a cached account, try silent token acquisition first
        if (account) {
            try {
                authResult = await msal.acquireTokenSilent({
                    scopes: scopes,
                    account: account,
                });
            } catch (silentError) {
                // Silent acquisition failed, will try interactive below
                console.debug("Silent token acquisition failed, falling back to interactive:", silentError);
            }
        }

        // If no account or silent acquisition failed, perform interactive login
        if (!authResult) {
            if (!account) {
                // No cached account, perform login
                authResult = await msal.loginPopup({
                    scopes: scopes,
                    prompt: "select_account",
                });
            } else {
                // Account exists but silent failed, try popup
                authResult = await msal.acquireTokenPopup({
                    scopes: scopes,
                    account: account,
                });
            }
        }

        if (!authResult) {
            throw new Error("Failed to acquire authentication result from MSAL");
        }

        // Calculate expiresIn in seconds
        const expiresIn = authResult.expiresOn
            ? Math.floor((authResult.expiresOn.getTime() - Date.now()) / 1000)
            : 3600;

        // Send tokens to server to create session
        const response = await fetch("/api/auth/msal", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessToken: authResult.accessToken,
                idToken: authResult.idToken,
                expiresIn,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create session from MSAL tokens. HttpCode: ${response.status}. ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("MSAL authentication failed:", error);
        throw new Error(`MSAL authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

export async function authenticate(): Promise<Session> {
    // Try to get the current session
    const response = await fetch("/api/auth/session");

    // There is no session, so we return null
    if (!response.ok) {
       return await login();
    }

    // There is a session
    const session: Session = await response.json();

    return session;
}

export async function login(): Promise<Session> {
    const promise = new Promise<Session>((resolve, reject) => {
        Office.onReady(async () => {
            try {
                // Try SSO first
                const bootstrapToken = await Office.auth.getAccessToken();

                const response = await fetch("/api/auth/sso", {
                    method: "POST",
                    body: JSON.stringify({ token: bootstrapToken }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to exchange token. HttpCode: ${response.status}`, { cause: response });
                }

                const session: Session = await response.json();

                return resolve(session);
            } catch (error) {
                // SSO failed, try MSAL as fallback
                console.warn("SSO authentication failed, falling back to MSAL:", error);

                try {
                    const session = await loginWithMSAL();
                    return resolve(session);
                } catch (msalError) {
                    reject(new Error(`Both SSO and MSAL authentication failed. SSO: ${error instanceof Error ? error.message : "Unknown error"}. MSAL: ${msalError instanceof Error ? msalError.message : "Unknown error"}`));
                }
            }
        })
    });

    return promise;
}
