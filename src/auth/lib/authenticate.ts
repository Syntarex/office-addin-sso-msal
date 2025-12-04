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
let msalInitialized = false;
let redirectPromiseHandled = false;

function getMsalInstance(): PublicClientApplication {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
    }
    return msalInstance;
}

/**
 * Ensures MSAL is initialized and redirect promise is handled.
 * This must be called before any authentication attempts to prevent interaction_in_progress errors.
 */
async function ensureMsalReady(): Promise<PublicClientApplication> {
    const msal = getMsalInstance();

    // Initialize MSAL if not already initialized
    if (!msalInitialized) {
        await msal.initialize();
        msalInitialized = true;
        console.log("MSAL initialized");
    }

    // Handle redirect promise to clear any pending interactions
    // This is critical to prevent interaction_in_progress errors
    if (!redirectPromiseHandled) {
        try {
            const redirectResponse = await msal.handleRedirectPromise();
            if (redirectResponse) {
                console.log("Handled pending redirect response");
            }
        } catch (redirectError) {
            // Ignore errors from handleRedirectPromise - it may return null if no redirect is pending
            console.debug("No pending redirect or redirect handling error:", redirectError);
        }
        redirectPromiseHandled = true;
    }

    return msal;
}

/**
 * Clears MSAL interaction state from session storage as a fallback.
 * This should only be used when handleRedirectPromise() doesn't resolve the issue.
 */
function clearInteractionState(): void {
    try {
        // Clear the interaction status from session storage
        sessionStorage.removeItem('msal.interaction.status');
        console.debug("Cleared MSAL interaction state from session storage");
    } catch (error) {
        console.debug("Failed to clear interaction state:", error);
    }
}

/**
 * Authenticates using MSAL as a fallback when SSO fails.
 */
async function loginWithMSAL(): Promise<Session> {
    // Ensure MSAL is ready (initialized + redirect promise handled)
    const msal = await ensureMsalReady();

    try {
        // Try to get account from cache first
        const accounts = msal.getAllAccounts();
        let account = accounts[0];
        let authResult: AuthenticationResult | null = null;

        console.log("Accounts: ", accounts);

        // If we have a cached account, try silent token acquisition first
        if (account) {
            console.log("Silent login using account: ", account);

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
            console.log("Silent login not possible, performing interactive login");

            try {
                if (!account) {
                    console.log("Open Popup to select account and login");
                    // No cached account, perform login
                    authResult = await msal.loginPopup({
                        scopes: scopes,
                        prompt: "select_account",
                    });
                } else {
                    console.log("Open Popup and login with account: ", account);
                    // Account exists but silent failed, try popup
                    authResult = await msal.acquireTokenPopup({
                        scopes: scopes,
                        account: account,
                    });
                }
            } catch (interactiveError: unknown) {
                // Check if this is an interaction_in_progress error
                const errorMessage = interactiveError instanceof Error ? interactiveError.message : String(interactiveError);

                if (errorMessage.includes("interaction_in_progress")) {
                    console.warn("Interaction in progress error detected, attempting to clear state and retry");

                    // Clear interaction state as fallback
                    clearInteractionState();

                    // Wait a brief moment before retry
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Retry the interactive authentication
                    try {
                        if (!account) {
                            authResult = await msal.loginPopup({
                                scopes: scopes,
                                prompt: "select_account",
                            });
                        } else {
                            authResult = await msal.acquireTokenPopup({
                                scopes: scopes,
                                account: account,
                            });
                        }
                    } catch (retryError) {
                        throw new Error(`MSAL interactive authentication failed after retry: ${retryError instanceof Error ? retryError.message : "Unknown error"}`);
                    }
                } else {
                    // Re-throw if it's not an interaction_in_progress error
                    throw interactiveError;
                }
            }
        }

        if (!authResult) {
            throw new Error("Failed to acquire authentication result from MSAL");
        }

        console.log("Auth Result: ", authResult);

        // Calculate expiresIn in seconds
        const expiresIn = authResult.expiresOn
            ? Math.floor((authResult.expiresOn.getTime() - Date.now()) / 1000)
            : 3600;

        console.log("Expires In: ", expiresIn);

        console.log("Send token to server");

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
    console.log("Authenticate");

    // Try to get the current session
    const response = await fetch("/api/auth/session");

    console.log("Response: ", response.ok);

    // There is no session, so we return null
    if (!response.ok) {
       return await login();
    }

    // There is a session
    const session: Session = await response.json();

    console.log("Session: ", session);

    return session;
}

export async function login(): Promise<Session> {
     const promise = new Promise<Session>((resolve, reject) => {
        Office.onReady(async () => {
            try {
                const session = await loginWithMSAL();
                resolve(session);
            } catch (error) {
                reject(error);
            }
            /* try {
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
            } */
        })
    });

    return promise;

}
