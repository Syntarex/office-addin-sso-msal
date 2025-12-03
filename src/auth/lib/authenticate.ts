import type { Session } from "@/auth/models/session.model";

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
                reject(error);
                // TODO: Use MSAL as fallback

            }
        })
    });

    return promise;
}
