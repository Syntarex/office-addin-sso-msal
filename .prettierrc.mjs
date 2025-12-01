/** @type {import('prettier').Config} */
export default {
    doubleQuote: true,
    endOfLine: "lf",
    plugins: [
        "prettier-plugin-tailwindcss",
        "prettier-plugin-packagejson",
        "prettier-plugin-astro",
    ],
    printWidth: 100,
    semi: true,
    tabWidth: 4,
    trailingComma: "all",
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
    ],
};
