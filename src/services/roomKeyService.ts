import { createRoomKeysForUsers } from "@/crypto/roomKeysCrypto";
import { importAesKeyFromRaw } from "@/crypto/webcrypto";
import { getCryptoSession } from "@/state/cryptoSession";
import { putRoomKey } from "@/state/roomKeysStore";
import type { RoomDataResponse, RoomMemberData } from "@/types/chat";
import { uploadRoomKeys, uploadRoomKeysForPendingRekey } from "./chatService";

type SetupRoomKeyParams = {
  roomId: number;
  version: number;
  members: RoomMemberData[];
};

export async function setupRoomKeyForRoom({
  roomId,
  version,
  members,
}: SetupRoomKeyParams) {
  const sender = getSenderContext();

  const result = await createRoomKeysForUsers({
    roomId,
    version,
    members: members.map(toGroupMember),
    sender,
  });

  await uploadRoomKeys(roomId, result.request);

  const cryptoKey = await importAesKeyFromRaw(result.roomKeyRaw);
  putRoomKey(roomId, version, cryptoKey);

  return { roomId, version, key: cryptoKey };
}

export async function tryPerformRekey(room: RoomDataResponse) {
  if (!room.rekeyRequired) return;

  const sender = getSenderContext();

  const nextVersion = room.currentKeyVersion + 1;

  const result = await createRoomKeysForUsers({
    roomId: room.roomId,
    sender,
    members: room.roomMembersDataList.map(toGroupMember),
    version: nextVersion,
  });

  try {
    const updatedRoom = await uploadRoomKeysForPendingRekey(
      room.roomId,
      result.request,
    );

    const cryptoKey = await importAesKeyFromRaw(result.roomKeyRaw);
    putRoomKey(room.roomId, nextVersion, cryptoKey);

    return updatedRoom;
  } catch (err: unknown){
    console.log(err);
    console.log("Rekey already handled by another member");
  }
}

function getSenderContext() {
  const cryptoSession = getCryptoSession();

  return {
    userId: cryptoSession.myUserId,
    mkAesKey: cryptoSession.myMasterKey,
    ecdhPrivateKey: cryptoSession.myEcdhPrivateKey,
  };
}

function toGroupMember(member: RoomMemberData) {
  return {
    userId: member.userId,
    publicEcdhJwk: member.publicEcdhJwk,
  };
}
