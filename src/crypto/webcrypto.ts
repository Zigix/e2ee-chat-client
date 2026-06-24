import { randomBytes, bytesToB64, utf8, b64ToBytes, toAb } from "./bytes";
import type { SessionKeys, VaultDto } from "../types/vault";

async function deriveKEK(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    utf8.enc(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const saltArrayBuffer = new Uint8Array(salt).buffer;

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltArrayBuffer, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv).buffer },
    key,
    new Uint8Array(plaintext).buffer,
  );
  return { iv, ciphertext: new Uint8Array(ct) };
}

export async function importAesKeyFromRaw(
  raw32: Uint8Array,
): Promise<CryptoKey> {
  if (raw32.length !== 32) throw new Error("MK must be 32 bytes");
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(raw32).buffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function generateEcdhKeypair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
}

async function exportEcdhPublicJwk(pub: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", pub);
  return JSON.stringify(jwk);
}

async function exportEcdhPrivateJwk(priv: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", priv);
  return JSON.stringify(jwk);
}

async function importEcdhPrivateJwk(privJwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(privJwkJson);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
}

export async function importEcdhPublicJwk(
  pubJwkJson: string,
): Promise<CryptoKey> {
  const jwk = JSON.parse(pubJwkJson);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

export async function deriveEcdhSharedSecretBits(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
): Promise<Uint8Array> {
  const bits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    256,
  );
  return new Uint8Array(bits);
}

export async function hkdfDeriveAesGcmKey(params: {
  ikm: Uint8Array;
  salt: Uint8Array;
  info: Uint8Array;
}): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toAb(params.ikm),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toAb(params.salt),
      info: toAb(params.info),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesGcmEncryptBytes(
  key: CryptoKey,
  plaintext: Uint8Array,
  aad?: Uint8Array,
) {
  const iv = randomBytes(12);
  const params: AesGcmParams = aad
    ? { name: "AES-GCM", iv: toAb(iv), additionalData: toAb(aad) }
    : { name: "AES-GCM", iv: toAb(iv) };

  const ct = await crypto.subtle.encrypt(params, key, toAb(plaintext));
  return { iv, ciphertext: new Uint8Array(ct) };
}

export async function aesGcmDecryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  aad?: Uint8Array,
) {
  const params: AesGcmParams = aad
    ? { name: "AES-GCM", iv: toAb(iv), additionalData: toAb(aad) }
    : { name: "AES-GCM", iv: toAb(iv) };

  console.log("decrypt sizes", {
    iv: iv.byteLength,
    ciphertext: ciphertext.byteLength,
  });
  const pt = await crypto.subtle.decrypt(params, key, toAb(ciphertext));
  return new Uint8Array(pt);
}

export async function createRegisterCrypto(password: string): Promise<{
  pubEcdhJwk: string;
  vault: VaultDto;
}> {
  // 1) MasterKey
  const masterKeyRaw: Uint8Array = randomBytes(32);
  const masterKey: CryptoKey = await importAesKeyFromRaw(masterKeyRaw);

  // 2) ECDH
  const ecdhKeyPair: CryptoKeyPair = await generateEcdhKeypair();
  const pubEcdhJwk: string = await exportEcdhPublicJwk(ecdhKeyPair.publicKey);
  const privEcdhJwk: string = await exportEcdhPrivateJwk(ecdhKeyPair.privateKey);

  // 3) KEK from password (PBKDF2)
  const kdfSalt: Uint8Array = randomBytes(16);
  const kdfIterations: number = 300_000;
  const kek: CryptoKey = await deriveKEK(password, kdfSalt, kdfIterations);

  // 4) wrappedMK = AES-GCM(KEK, MK)
  const wrappedMk = await aesGcmEncrypt(kek, masterKeyRaw);

  // 5) wrappedEcdhPriv = AES-GCM(MK, privEcdhJwkJson)
  const wrappedEcdhPrivKey = await aesGcmEncrypt(masterKey, utf8.enc(privEcdhJwk));

  return {
    pubEcdhJwk,
    vault: {
      version: 1,
      kdfSaltB64: bytesToB64(kdfSalt),
      kdfIterations,
      wrappedMkB64: bytesToB64(wrappedMk.ciphertext),
      wrappedMkIvB64: bytesToB64(wrappedMk.iv),
      wrappedEcdhPrivB64: bytesToB64(wrappedEcdhPrivKey.ciphertext),
      wrappedEcdhPrivIvB64: bytesToB64(wrappedEcdhPrivKey.iv),
    },
  };
}

export async function recoverSessionKeys(
  password: string,
  vault: VaultDto,
): Promise<SessionKeys> {
  // (1) base64 to bytes
  const salt: Uint8Array = b64ToBytes(vault.kdfSaltB64);
  const wrappedMk: Uint8Array = b64ToBytes(vault.wrappedMkB64);
  const wrappedMkIv: Uint8Array = b64ToBytes(vault.wrappedMkIvB64);

  const wrappedPriv: Uint8Array = b64ToBytes(vault.wrappedEcdhPrivB64);
  const wrappedPrivIv: Uint8Array = b64ToBytes(vault.wrappedEcdhPrivIvB64);

  // (2) KEK = PBKDF2(password, salt, iterations)
  const kek: CryptoKey = await deriveKEK(password, salt, vault.kdfIterations);

  // (3) MK = AES-GCM-decrypt(KEK, wrappedMK)
  const mkRaw32 = await aesGcmDecryptBytes(kek, wrappedMkIv, wrappedMk);

  // (4) Import MK to AES key
  const mkAesKey: CryptoKey = await importAesKeyFromRaw(mkRaw32);

  // (5) Decrypt privECDH JWK JSON
  const privJwkBytes = await aesGcmDecryptBytes(
    mkAesKey,
    wrappedPrivIv,
    wrappedPriv,
  );
  const privJwkJson = new TextDecoder().decode(privJwkBytes);

  // (6) Import ECDH private key to CryptoKey
  const ecdhPrivateKey: CryptoKey = await importEcdhPrivateJwk(privJwkJson);

  return { mkAesKey, ecdhPrivateKey };
}
