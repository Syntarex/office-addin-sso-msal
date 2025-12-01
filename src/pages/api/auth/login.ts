import { microsoftEntra, scopes } from "@/auth/auth.config";
import { generateCodeVerifier, generateState } from "arctic";
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ redirect, cookies }) => {
    // Delete cookies
    cookies.delete("microsoft_entra_state");
    cookies.delete("microsoft_entra_code_verifier");

    // Create a state so the authorization process is more safe from middle-man attacks
    const state = generateState();
    cookies.set("microsoft_entra_state", state, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10, // 10 Minutes
        sameSite: "lax",
    });

    // Create a code verifier so we support the PKCE extension
    const codeVerifier = generateCodeVerifier();
    cookies.set("microsoft_entra_code_verifier", codeVerifier, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10, // 10 Minutes
        sameSite: "lax",
    });

    // Generate login url and make the user select its account
    const loginUrl = microsoftEntra.createAuthorizationURL(state, codeVerifier, scopes);
    loginUrl.searchParams.set("prompt", "select_account");

    return redirect(loginUrl.toString());
};
