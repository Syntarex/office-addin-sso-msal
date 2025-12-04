export async function getSSOBootstrapToken() {
    return await Office.auth.getAccessToken();
}
