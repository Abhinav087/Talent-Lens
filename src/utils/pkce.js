/**
 * Generates a cryptographically secure random string (code verifier)
 * for PKCE OAuth authentication.
 * 
 * @returns {string} High-entropy random code verifier
 */
export function generateCodeVerifier() {
  const array = new Uint32Array(28); // 56 hex chars
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => dec.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes the SHA-256 hash of the verifier and encodes it to base64url format
 * as the code challenge for PKCE OAuth.
 * 
 * @param {string} verifier The code verifier
 * @returns {Promise<string>} Base64url-encoded code challenge
 */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  
  // Convert ArrayBuffer to binary string, then base64url encode
  let str = "";
  const bytes = new Uint8Array(hash);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
