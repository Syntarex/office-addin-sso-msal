import type { Session } from "@/auth/models/session.model";
import { getMSALBootstrapToken } from "@/auth/msal/get-msal-bootstrap-token";

export async function authenticate(): Promise<Session> {
    const session: Session = await new Promise<Session>((resolve, reject) => {
        Office.onReady(async () => {
            console.log("Authenticate");

            // Try to get the current session
            const sessionResponse = await fetch("/api/auth/session");

            console.log("Response: ", sessionResponse.ok);

            // There is a session
            if (sessionResponse.ok) {
                const session: Session = await sessionResponse.json();

                console.log("Session: ", session);

                resolve(session);
                return;
            }

            // There is no session, so we login
            const bootstrapToken = await getMSALBootstrapToken();

            const loginResponse = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ bootstrapToken }),
            });

            if (!loginResponse.ok) {
                reject(new Error(`Failed to login. HttpCode: ${loginResponse.status}`, { cause: loginResponse }));
                return;
            }

            const session: Session = await loginResponse.json();

            resolve(session);
            return;
        })
    });

    return session;
}
