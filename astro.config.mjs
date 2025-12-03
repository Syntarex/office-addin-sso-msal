import node from "@astrojs/node";
import https from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "astro/config";
import { toInt } from "radash";

const port = process.env.PORT ? toInt(process.env.PORT) : 4321;

const site = process.env.SITE_URL
    ? `https://${process.env.SITE_URL}`
    : process.env.WEBSITE_HOSTNAME
        ? `https://${process.env.WEBSITE_HOSTNAME}`
        : `https://localhost:${port}`;

/** @type {import('astro').AstroConfig} */
export default defineConfig({
    site,
    output: "static",
    adapter: node({ mode: "standalone" }),
    env: {
        schema: {
            ASTRO_KEY: {
                context: "server",
                access: "secret",
                type: "string",
            },
            DB_URL: {
                context: "server",
                access: "secret",
                type: "string",
            },
            DB_AUTH_TOKEN: {
                context: "server",
                access: "secret",
                type: "string",
                optional: true,
            },
            DB_REPLICA_PATH: {
                context: "server",
                access: "secret",
                type: "string",
                optional: true,
            },
            DB_REPLICA_SYNC_INTERVAL: {
                context: "server",
                access: "secret",
                type: "number",
                optional: true,
            },
            SITE_URL: {
                context: "server",
                access: "public",
                type: "string",
                default: site,
            },
            TENANT_ID: {
                context: "client",
                access: "public",
                type: "string",
            },
            ENTRA_APP_ID: {
                context: "client",
                access: "public",
                type: "string",
            },
            ENTRA_APP_SECRET: {
                context: "server",
                access: "secret",
                type: "string",
            },
        },
    },
    vite: {
        plugins: import.meta.env.DEV ? [https()] : [],
    }
});
