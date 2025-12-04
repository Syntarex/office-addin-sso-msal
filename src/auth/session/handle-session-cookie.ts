import type { APIContext } from "astro";

export function getSessionTokenFromCookie(context: APIContext): string | null {
    const token = context.cookies.get("session")?.value ?? null;

    if (!token) {
        return null;
    }

    return token;
}

export function setSessionTokenCookie(context: APIContext, token: string, expiresAt: Date): void {
    context.cookies.set("session", token, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        expires: expiresAt,
        sameSite: "lax",
    });
}

export function deleteSessionTokenCookie(context: APIContext): void {
    context.cookies.set("session", "", {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
    });
}
