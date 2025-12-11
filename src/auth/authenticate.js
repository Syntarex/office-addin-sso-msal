import { getMSALBootstrapToken } from "./msal/get-msal-bootstrap-token";
import { getSSOBootstrapToken } from "./sso/get-sso-bootstrap-token";

export async function authenticate() {
    const session = await new Promise((resolve, reject) => {
        Office.onReady(async () => {
            // Try to get the current session
            const sessionResponse = await fetch("/api/auth/session");

            // There is a session
            if (sessionResponse.ok) {
                const session = await sessionResponse.json();

                resolve(session);
                return;
            }

            let bootstrapToken;
            try {
                bootstrapToken = await getSSOBootstrapToken();
            } catch (error) {
                bootstrapToken = await getMSALBootstrapToken();
            }

            const loginResponse = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ bootstrapToken }),
            });

            if (!loginResponse.ok) {
                reject(new Error(`Failed to login. HttpCode: ${loginResponse.status}`, { cause: loginResponse }));
                return;
            }

            const session = await loginResponse.json();

            resolve(session);
            return;
        })
    });

    return session;
}
