import { bytesToB64, randomBytes, utf8 } from "./bytes";
import { aesGcmEncryptBytes, importEcdhPublicJwk, deriveEcdhSharedSecretBits, hkdfDeriveAesGcmKey } from "./webcrypto";

type GroupMember = {
  userId: number;
  publicEcdhJwk: string;
};

type SenderContext = {
  userId: number;
  mkAesKey: CryptoKey;
  ecdhPrivateKey: CryptoKey;
};

export async function createRoomKeysForUsers(params: {
  roomId: number;
  sender: SenderContext;
  members: GroupMember[];
  version: number;
}) {
  const { roomId, sender, members, version } = params;

  // Generate RoomKey
  const roomKeyRaw = randomBytes(32);

  const keyItems: {
    userId: number;
    wrappedRoomKeyB64: string;
    ivB64: string;
    aadB64: string;
  }[] = [];

 
  for (const member of members) {
    let encrypted;
    let aad: Uint8Array;

    // Sender uses MK to encrypt RoomKey
    if (member.userId === sender.userId) {
      aad = utf8.enc(JSON.stringify({
        roomId,
        userId: member.userId,
        type: "room_key_mk"
      }));

      encrypted = await aesGcmEncryptBytes(
        sender.mkAesKey,
        roomKeyRaw,
        aad
      );
    } 
    

    // For other users use their public key
    else {
      const pubKey = await importEcdhPublicJwk(member.publicEcdhJwk);

      const sharedSecret = await deriveEcdhSharedSecretBits(
        sender.ecdhPrivateKey,
        pubKey
      );

      const derivedKey = await hkdfDeriveAesGcmKey({
        ikm: sharedSecret,
        salt: new Uint8Array([]),
        info: utf8.enc(`room-key-wrap:${roomId}`)
      });

      aad = utf8.enc(JSON.stringify({
        roomId,
        userId: member.userId,
        type: "room_key_ecdh"
      }));

      encrypted = await aesGcmEncryptBytes(
        derivedKey,
        roomKeyRaw,
        aad
      );
    }

    keyItems.push({
      userId: member.userId,
      wrappedRoomKeyB64: bytesToB64(encrypted.ciphertext),
      ivB64: bytesToB64(encrypted.iv),
      aadB64: bytesToB64(aad)
    });
  }


  return {
    request: {
      version,
      wrappedByUserId: sender.userId,
      keyItems
    },

    roomKeyRaw
  };
}