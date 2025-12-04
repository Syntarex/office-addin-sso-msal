import type { APIRoute } from "astro";
import { ENTRA_APP_ID, SITE_URL, TENANT_ID } from "astro:env/client";

export const prerender = false;

export const GET: APIRoute = async ({ redirect }) => {
    return redirect(`https:// login.microsoftonline.com/${TENANT_ID}/v2.0/adminconsent?client_id=${ENTRA_APP_ID}&scope=.default&redirect_uri=https://${SITE_URL}`);
};
