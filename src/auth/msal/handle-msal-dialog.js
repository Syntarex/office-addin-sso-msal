import { msal, msalLoginRequest } from "../auth.config";

export function handleMSALDialog() {
    Office.initialize = async function () {
        if (Office.context.ui.messageParent) {
            try {
                await msal.initialize();

                const response = await msal.handleRedirectPromise();

                handleResponse(response);
            } catch (error) {
                console.error("Handling the MSAL response failed", error);

                Office.context.ui.messageParent(
                    JSON.stringify({ status: "error", error: error instanceof Error ? error.message : "Unknown error" }),
                    { targetOrigin: window.location.origin }
                );
            }
        }
    };
}

function handleResponse(response) {
    /**
     * To see the full list of response object properties, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
     */

    if (response !== null) {
        Office.context.ui.messageParent(
            JSON.stringify({ status: "success", result: response.accessToken, accountId: response.account.homeAccountId }),
            { targetOrigin: window.location.origin }
        );
    } else {
        msal.loginRedirect(msalLoginRequest);
    }
}
