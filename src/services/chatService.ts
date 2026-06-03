import {
  createNewGroupChat,
  createOrGetPrivateConversation,
  getAllRoomKeysForRoom,
  getRoomKeyForRoom,
  uploadKeys,
  uploadRoomKeysForRekey,
} from "@/api/chat";
import { getUserPublicEcdhJwk } from "@/api/users";
import { b64ToBytes, utf8 } from "@/crypto/bytes";
import {
  aesGcmDecryptBytes,
  deriveEcdhSharedSecretBits,
  hkdfDeriveAesGcmKey,
  importAesKeyFromRaw,
  importEcdhPublicJwk,
} from "@/crypto/webcrypto";
import { getCryptoSession } from "@/state/cryptoSession";
import { putRoomKey } from "@/state/roomKeysStore";
import type { CreateGroupRoomRequest } from "@/types/groupChat";
import type { UploadRoomKeysApiRequest } from "@/api/chatDtos";

export async function createPrivateRoom(otherUserId: number) {
  return await createOrGetPrivateConversation({ otherUserId });
}

export async function createGroupChatService(request: CreateGroupRoomRequest) {
  return await createNewGroupChat(request);
}

export async function uploadRoomKeys(
  roomId: number,
  request: UploadRoomKeysApiRequest,
) {
  return await uploadKeys(roomId, request);
}

export async function uploadRoomKeysForPendingRekey(
  roomId: number,
  request: UploadRoomKeysApiRequest,
) {
  return await uploadRoomKeysForRekey(roomId, request);
}

export async function fetchAndStoreMyRoomKey(roomId: number, version: number) {
  const myKeyResponse = await getRoomKeyForRoom(roomId, version);

  const myCryptoSession = getCryptoSession();

  if (myKeyResponse.wrappedByUserId === myCryptoSession.myUserId) {
    const myRoomKey = await aesGcmDecryptBytes(
      myCryptoSession.myMasterKey,
      b64ToBytes(myKeyResponse.ivB64),
      b64ToBytes(myKeyResponse.wrappedRoomKeyB64),
      b64ToBytes(myKeyResponse.aadB64),
    );

    const roomKeyCryptoKey = await importAesKeyFromRaw(myRoomKey);

    putRoomKey(roomId, version, roomKeyCryptoKey);
  } else {
    const wrappedByPublicEcdhJwk = await getUserPublicEcdhJwk(
      myKeyResponse.wrappedByUserId,
    );

    console.log(wrappedByPublicEcdhJwk);

    const wrapperPublicKey = await importEcdhPublicJwk(
      JSON.stringify(wrappedByPublicEcdhJwk),
    );

    console.log(wrapperPublicKey);

    const sharedSecret = await deriveEcdhSharedSecretBits(
      myCryptoSession.myEcdhPrivateKey,
      wrapperPublicKey,
    );

    const derivedKey = await hkdfDeriveAesGcmKey({
      ikm: sharedSecret,
      salt: new Uint8Array([]),
      info: utf8.enc(`room-key-wrap:${myKeyResponse.roomId}`),
    });

    const roomKeyRaw = await aesGcmDecryptBytes(
      derivedKey,
      b64ToBytes(myKeyResponse.ivB64),
      b64ToBytes(myKeyResponse.wrappedRoomKeyB64),
      b64ToBytes(myKeyResponse.aadB64),
    );

    const roomKeyCryptoKey = await importAesKeyFromRaw(roomKeyRaw);
    putRoomKey(roomId, version, roomKeyCryptoKey);
  }
}

export async function fetchAndStoreAllMyRoomKeysForRoom(roomId: number) {
  const keyEnvelopes = await getAllRoomKeysForRoom(roomId);

  const myCryptoSession = getCryptoSession();

  for (const envelope of keyEnvelopes) {
    if (envelope.wrappedByUserId === myCryptoSession.myUserId) {
      const myRoomKey = await aesGcmDecryptBytes(
        myCryptoSession.myMasterKey,
        b64ToBytes(envelope.ivB64),
        b64ToBytes(envelope.wrappedRoomKeyB64),
        b64ToBytes(envelope.aadB64),
      );

      const roomKeyCryptoKey = await importAesKeyFromRaw(myRoomKey);

      putRoomKey(roomId, envelope.version, roomKeyCryptoKey);
    } else {
      const wrappedByPublicEcdhJwk = await getUserPublicEcdhJwk(
        envelope.wrappedByUserId,
      );

      console.log(wrappedByPublicEcdhJwk);

      const wrapperPublicKey = await importEcdhPublicJwk(
        JSON.stringify(wrappedByPublicEcdhJwk),
      );

      console.log(wrapperPublicKey);

      const sharedSecret = await deriveEcdhSharedSecretBits(
        myCryptoSession.myEcdhPrivateKey,
        wrapperPublicKey,
      );

      const derivedKey = await hkdfDeriveAesGcmKey({
        ikm: sharedSecret,
        salt: new Uint8Array([]),
        info: utf8.enc(`room-key-wrap:${roomId}`),
      });

      const roomKeyRaw = await aesGcmDecryptBytes(
        derivedKey,
        b64ToBytes(envelope.ivB64),
        b64ToBytes(envelope.wrappedRoomKeyB64),
        b64ToBytes(envelope.aadB64),
      );

      const roomKeyCryptoKey = await importAesKeyFromRaw(roomKeyRaw);
      putRoomKey(roomId, envelope.version, roomKeyCryptoKey);
    }
  }
}
