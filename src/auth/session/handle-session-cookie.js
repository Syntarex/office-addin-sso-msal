
export function getSessionTokenFromCookie(context) {
    const token = context.cookies.get("session")?.value ?? null;

    if (!token) {
        return null;
    }

    return token;
}

export function setSessionTokenCookie(context, token, expiresAt) {
    context.cookies.set("session", token, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        expires: expiresAt,
        sameSite: "lax",
    });
}

export function deleteSessionTokenCookie(context) {
    context.cookies.set("session", "", {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 0,
        sameSite: "lax",
    });
}
