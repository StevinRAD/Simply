/**
 * Simply Extension - Crypto Module
 * Enkripsi AES-GCM 256-bit untuk melindungi data sensitif di storage dan komunikasi.
 *
 * Cara kerja:
 *  - Kunci enkripsi di-derive dari EXTENSION_SECRET + chrome.runtime.id menggunakan PBKDF2
 *  - Data dienkripsi dengan AES-GCM (IV acak 12 byte per enkripsi)
 *  - Output disimpan sebagai Base64 string: "<iv_b64>:<ciphertext_b64>"
 */

const SIMPLY_CRYPTO_VERSION = 1;
const PBKDF2_ITERATIONS = 200_000;
const KEY_LENGTH = 256;
// Salt statis — dikombinasikan dengan runtime.id agar unik per instalasi
const BASE_SALT = "simply-ext-v1-salt-2025";

let _cachedKey = null;

/**
 * Derive CryptoKey dari secret + extension runtime ID.
 * Hasilnya di-cache agar tidak perlu re-derive setiap operasi.
 * @returns {Promise<CryptoKey>}
 */
async function getDerivedKey() {
  if (_cachedKey) return _cachedKey;

  // Gabungkan secret dengan runtime ID agar kunci unik per instalasi
  const secret = `simply-secure-${chrome.runtime.id}-2025`;
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

/**
 * Enkripsi data (object/string/array) → Base64 string terenkripsi.
 * @param {*} data - Data yang akan dienkripsi (akan di-JSON.stringify)
 * @returns {Promise<string>} - Format: "v1:<iv_b64>:<ciphertext_b64>"
 */
async function encryptData(data) {
  try {
    const key = await getDerivedKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV untuk AES-GCM
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
    console.error("[Simply Crypto] Enkripsi gagal:", err);
    throw err;
  }
}

/**
 * Dekripsi string terenkripsi → data asli.
 * @param {string} encryptedStr - Format: "v1:<iv_b64>:<ciphertext_b64>"
 * @returns {Promise<*>} - Data asli (hasil JSON.parse)
 */
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
    console.error("[Simply Crypto] Dekripsi gagal:", err);
    throw err;
  }
}

/**
 * Simpan data terenkripsi ke chrome.storage.local.
 * @param {string} key - Kunci storage
 * @param {*} value - Nilai yang akan dienkripsi dan disimpan
 */
async function setEncrypted(key, value) {
  const encrypted = await encryptData(value);
  await chrome.storage.local.set({ [key]: encrypted });
}

/**
 * Ambil dan dekripsi data dari chrome.storage.local.
 * @param {string} key - Kunci storage
 * @returns {Promise<*>} - Data asli, atau null jika tidak ada / gagal dekripsi
 */
async function getEncrypted(key) {
  try {
    const result = await chrome.storage.local.get([key]);
    const encrypted = result[key];
    if (!encrypted) return null;

    // Jika data lama (belum terenkripsi), kembalikan apa adanya
    if (typeof encrypted !== "string" || !encrypted.startsWith("v1:")) {
      return encrypted;
    }

    return await decryptData(encrypted);
  } catch (err) {
    console.error(`[Simply Crypto] Gagal baca storage key "${key}":`, err);
    return null;
  }
}

/**
 * Enkripsi pesan untuk dikirim antar komponen extension.
 * @param {object} message - Pesan yang akan dienkripsi
 * @returns {Promise<object>} - { _encrypted: true, payload: "<encrypted_str>" }
 */
async function encryptMessage(message) {
  const payload = await encryptData(message);
  return { _encrypted: true, _v: SIMPLY_CRYPTO_VERSION, payload };
}

/**
 * Dekripsi pesan yang diterima dari komponen lain.
 * @param {object} envelope - { _encrypted: true, payload: "<encrypted_str>" }
 * @returns {Promise<object>} - Pesan asli
 */
async function decryptMessage(envelope) {
  if (!envelope || !envelope._encrypted || !envelope.payload) {
    throw new Error("Bukan pesan terenkripsi yang valid");
  }
  return await decryptData(envelope.payload);
}

/**
 * Cek apakah suatu nilai adalah string terenkripsi Simply.
 * @param {*} value
 * @returns {boolean}
 */
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(`v${SIMPLY_CRYPTO_VERSION}:`);
}
