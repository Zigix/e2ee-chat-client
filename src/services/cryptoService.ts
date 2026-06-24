// chat/services/cryptoService.ts

import type { WsSendMessage } from "@/types/ws";
import {
  decryptMessageAesGcm,
  encryptMessageAesGcm,
  type EncryptedMessage,
} from "../crypto/messageCrypto";
import { getLatestRoomKey, getRoomKey } from "../state/roomKeysStore";
import type { EncryptedMessageDto } from "../types/types";

export async function encryptForRoom(
  roomId: number,
  text: string,
): Promise<WsSendMessage> {
  const roomKey = getLatestRoomKey(roomId);

  if (!roomKey) {
    throw new Error(`Missing room key for room ${roomId}`);
  }

  const encrypted: EncryptedMessage = await encryptMessageAesGcm(
    roomKey.key,
    text,
    `${roomId}${roomKey.version}`,
  );

  return {
    keyVersion: roomKey.version,
    ciphertextB64: encrypted.ciphertextB64,
    ivB64: encrypted.ivB64,
    aadB64: encrypted.aadB64,
  };
}

export async function tryDecryptMessage(
  roomId: number,
  m: EncryptedMessageDto,
) {
  try {
    return await decryptForRoom(roomId, m);
  } catch {
    console.log(`Decrypt message failed`);
    return null;
  }
}

async function decryptForRoom(
  roomId: number,
  message: EncryptedMessageDto,
): Promise<string> {
  const keyVersion = message.keyVersion;

  if (keyVersion == null)
    throw new Error(`Missing key version for room ${roomId}`);

  const roomKey = getRoomKey(roomId, keyVersion);

  if (!roomKey) {
    throw new Error(
      `Missing room key for room ${roomId}, version ${keyVersion}`,
    );
  }

  if (message.ciphertextB64 == null)
    throw new Error(`Missing ciphertext for room ${roomId}`);

  if (message.ivB64 == null)
    throw new Error(`Missing IV for room ${roomId}`);

  return decryptMessageAesGcm(roomKey.key, {
    ciphertextB64: message.ciphertextB64,
    ivB64: message.ivB64,
    aadB64: message.aadB64 ?? "",
  });
}
