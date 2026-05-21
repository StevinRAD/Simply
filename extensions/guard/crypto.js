/**
 * Simply Guard - Crypto Module
 * Enkripsi AES-GCM 256-bit untuk melindungi data sensitif di storage.
 *
 * Cara kerja:
 *  - Kunci enkripsi di-derive dari secret + chrome.runtime.id menggunakan PBKDF2
 *  - Data dienkripsi dengan AES-GCM (IV acak 12 byte per enkripsi)
 *  - Output: "v1:<iv_b64>:<ciphertext_b64>"
 */

const SIMPLY_CRYPTO_VERSION = 1;
const PBKDF2_ITERATIONS = 200_000;
const KEY_LENGTH = 256;
const BASE_SALT = "simply-guard-v1-salt-2025";

let _cachedKey = null;

async function getDerivedKey() {
  if (_cachedKey) return _cachedKey;

  const secret = `simply-guard-secure-${chrome.runtime.id}-2025`;
  const saltStr = `${BASE_SALT}-${chrome.runtime.id}`;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  _cachedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(saltStr),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  return _cachedKey;
}

async function encryptData(data) {
  try {
    const key = await getDerivedKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const plaintext = enc.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      plaintext
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    return `v${SIMPLY_CRYPTO_VERSION}:${ivB64}:${ctB64}`;
  } catch (err) {
    console.error("[Guard Crypto] Enkripsi gagal:", err);
    throw err;
  }
}

async function decryptData(encryptedStr) {
  try {
    if (!encryptedStr || typeof encryptedStr !== "string") {
      throw new Error("Input dekripsi tidak valid");
    }

    const parts = encryptedStr.split(":");
    if (parts.length !== 3 || parts[0] !== `v${SIMPLY_CRYPTO_VERSION}`) {
      throw new Error("Format data terenkripsi tidak dikenali");
    }

    const [, ivB64, ctB64] = parts;
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));

    const key = await getDerivedKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext));
  } catch (err) {
    console.error("[Guard Crypto] Dekripsi gagal:", err);
    throw err;
  }
}

async function setEncrypted(key, value) {
  const encrypted = await encryptData(value);
  await chrome.storage.local.set({ [key]: encrypted });
}

async function getEncrypted(key) {
  try {
    const result = await chrome.storage.local.get([key]);
    const encrypted = result[key];
    if (!encrypted) return null;

    if (typeof encrypted !== "string" || !encrypted.startsWith("v1:")) {
      return encrypted;
    }

    return await decryptData(encrypted);
  } catch (err) {
    console.error(`[Guard Crypto] Gagal baca storage key "${key}":`, err);
    return null;
  }
}

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(`v${SIMPLY_CRYPTO_VERSION}:`);
}
