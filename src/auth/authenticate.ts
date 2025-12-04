import type { Session } from "@/auth/models/session.model";
import { getMSALBootstrapToken } from "@/auth/msal/get-msal-bootstrap-token";
import { getSSOBootstrapToken } from "@/auth/sso/get-sso-bootstrap-token";

export async function authenticate(): Promise<Session> {
    const session: Session = await new Promise<Session>((resolve, reject) => {
        Office.onReady(async () => {
            // Try to get the current session
            const sessionResponse = await fetch("/api/auth/session");

            // There is a session
            if (sessionResponse.ok) {
                const session: Session = await sessionResponse.json();

                resolve(session);
                return;
            }

            let bootstrapToken: string;
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

            const session: Session = await loginResponse.json();

            resolve(session);
            return;
        })
    });

    return session;
}
