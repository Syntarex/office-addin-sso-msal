import { LogLevel, PublicClientApplication } from "@azure/msal-browser";
import { ENTRA_APP_API_RESOURCE, ENTRA_APP_ID, SITE_URL, TENANT_ID } from "astro:env/client";

/**
 * The token endpoint which is used to exchange the bootstrap token.
 */
export const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

/**
 * The scopes you want the bootstrap token to be exchanged for.
 */
export const scopes = ["openid", "profile", "offline_access", "User.Read", "User.ReadBasic.All"];


/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig = {
    auth: {
        clientId: ENTRA_APP_ID, // This is the ONLY mandatory field that you need to supply.
        authority: `https://login.microsoftonline.com/${TENANT_ID}`, // Defaults to "https://login.microsoftonline.com/common"
        redirectUri: `https://${SITE_URL}/dialog.html`, // You must register this URI on Azure Portal/App Registration. Defaults to window.location.href
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    },
    cache: {
        cacheLocation: "sessionStorage", // Because our own session cookie is persistent, we don't need to store auth state of msal in localStorage.
        storeAuthStateInCookie: false, // We manage our own session cookie, so we don't need to store auth state of msal.
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }

                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

/**
 * The main MSAL client of the app.
 */
export const msal = new PublicClientApplication(msalConfig);

/**
* Scopes you add here will be prompted for user consent during sign-in.
* By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
* For more information about OIDC scopes, visit:
* https://learn.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
*
* We use the `access_as_user` scope to make exchanging the token for a graph token possible.
*/
export const msalLoginRequest = { scopes: [`${ENTRA_APP_API_RESOURCE}/access_as_user`] }


/**
 * The lifetime of a session.
 * Value is in milliseconds.
 */
export const sessionLifetime = 1000 * 60 * 60 * 24 * 90; // 90 days because Microsoft Entra refresh tokens are 90 days valid

/**
 * The threshold for refreshing the Microsoft Entra access token.
 * If this treshold is reached, the access token will be refreshed.
 * Value is in milliseconds.
 */
export const accessTokenTreshold = 1000 * 60 * 10; // 10 minutes

