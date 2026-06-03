type StoredRoomKey = {
  key: CryptoKey;
  version: number;
};

const roomKeys = new Map<number, Map<number, StoredRoomKey>>();

export function putRoomKey(
  roomId: number,
  version: number,
  key: CryptoKey
) {
  console.log("[putRoomKey]", { roomId, version });
  console.trace();

  if (!roomKeys.has(roomId)) {
    roomKeys.set(roomId, new Map());
  }

  roomKeys.get(roomId)!.set(version, {
    key,
    version,
  });
}

export function getRoomKey(
  roomId: number,
  version: number
): StoredRoomKey | null {
  return roomKeys.get(roomId)?.get(version) ?? null;
}

export function getLatestRoomKey(roomId: number): StoredRoomKey | null {
  const versions = roomKeys.get(roomId);
  if (!versions) return null;

  return [...versions.values()].sort((a, b) => b.version - a.version)[0] ?? null;
}

export function clearRoomKeys() {
  roomKeys.clear();
}