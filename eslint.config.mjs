import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import ts from "typescript-eslint";

/** @type {import('eslint').Linter.Config} */
export default ts.config(
    js.configs.recommended,
    ts.configs.recommended,
    {
        files: ["*.js", "*.ts", "*.mjs"],
        language: {
            env: "node"
        }
    },
    {
        files: ["*.astro"],
        plugins: {
            astro,
        },
        extends: [
            astro.configs.recommended,
        ],
    },
    prettier,
);
