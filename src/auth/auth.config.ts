/**
 * The lifetime of a session.
 * Value is in milliseconds.
 */
export const sessionLifetime = 1000 * 60 * 60 * 24 * 90; // 90 days because Microsoft Entra refresh tokens are 90 days valid

/**
 * The threshold for refreshing the Microsoft Entra access token.
 * If this treshold is reached, the access token will be refreshed.
 * Value is in milliseconds.
 */
export const accessTokenTreshold = 1000 * 60 * 10; // 10 minutes

/**
 * The scopes which will be required to be consented by the user.
 */
export const scopes = ["openid", "profile", "offline_access", "User.Read", "User.ReadBasic.All"];
