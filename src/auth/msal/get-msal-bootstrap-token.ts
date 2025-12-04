import { msal, msalLoginRequest } from "@/auth/auth.config";
import { SITE_URL } from "astro:env/client";


/**
 * Gets a bootstrap token using MSAL (Microsoft Authentication Library for the browser.)
 */
export async function getMSALBootstrapToken(): Promise<string> {
    await msal.initialize();

    // Try to get account from cache first
    const accounts = msal.getAllAccounts();

    console.log("Accounts: ", accounts);

    const account = accounts[0];

    console.log("Account: ", account);

    // Attempt to acquire token silently if user is already signed in.
    if (account) {
        const result = await msal.acquireTokenSilent({ ...msalLoginRequest, account });

        if (result !== null && result.accessToken !== null) {
            return result.accessToken;
        }
    }

    // Create a promise to wrap the dialog callback we need to process later in this function.
    const token = await new Promise<string>((resolve, reject) => {
        const url = `https://${SITE_URL}/dialog`;

        // height and width are percentages of the size of the parent Office application, e.g., Outlook, PowerPoint, Excel, Word, etc.
        Office.context.ui.displayDialogAsync(
            url,
            { height: 60, width: 30 },
            (result) => {
                if (result.status === Office.AsyncResultStatus.Failed) {
                    console.error("Failed to show dialog", result.error);
                    reject(result.error);
                } else {
                    const dialog = result.value;

                    // Handler for the dialog box closing unexpectedly.
                    dialog.addEventHandler(
                        Office.EventType.DialogEventReceived,
                        (event) => {
                            dialog.close();
                            // For more dialog codes, see https://learn.microsoft.com/office/dev/add-ins/develop/dialog-handle-errors-events#errors-and-events-in-the-dialog-box
                            if ("error" in event) {
                                switch (event.error) {
                                    case 12002:
                                        reject("The auth dialog box has been directed to a page that it cannot find or load, or the URL syntax is invalid");
                                        break;
                                    case 12003:
                                        reject("The auth dialog box has been directed to a URL with the HTTP protocol. HTTPS is required");
                                        break;
                                    case 12006:
                                        reject("The auth dialog box was closed before the user signed in");
                                        break;
                                    default:
                                        reject("Unknown error in auth dialog box");
                                        break;
                                }
                            }
                        }
                    );
                    dialog.addEventHandler(
                        Office.EventType.DialogMessageReceived,
                        (event) => {
                            dialog.close();

                            if ("error" in event) {
                                // Something went wrong with authentication or the authorization of the web application.
                                reject(event.error);
                                return;
                            }

                            const messageFromDialog = JSON.parse(event.message);

                            if (messageFromDialog.status === 'success') {
                                // Set the active account so future token requests can be silent
                                msal.setActiveAccount(msal.getAccount({ homeAccountId:messageFromDialog.accountId }));

                                // Return the token
                                resolve(messageFromDialog.result);
                            } else {
                                reject("Authentication failed");
                                return;
                            }
                        }
                    );
                }
            }
        );
    });

    return token;
}
