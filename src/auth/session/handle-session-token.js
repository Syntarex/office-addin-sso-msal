import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";

/**
 * Generates a super random token.
 *
 * This token will be used as the identifier of a user's session.
 *
 */
export function generateSessionToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    const token = encodeBase32LowerCaseNoPadding(bytes);

    return token;
}

/**
 * Encrypts a session token.
 *
 * The encrypted value is meant to be the `id` field of a session database item.
 */
export function encryptSessionToken(token) {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}
