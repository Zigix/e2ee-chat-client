export type MyKeyResponse = {
  roomId: number,
  version: number,
  wrappedByUserId: number,
  wrappedRoomKeyB64: string,
  ivB64: string,
  aadB64: string
}

export type CreateDmRequest = {
  otherUserId: number;
};

export type RoomType = "PRIVATE" | "GROUP";

export type RoomMemberRole = "ADMIN" | "MEMBER";

export type RoomMemberData = {
  memberId: number;
  userId: number;
  username: string;
  role: RoomMemberRole;
  publicEcdhJwk: string;
};

export type RoomDataResponse = {
  roomId: number;
  roomName: string;
  roomType: RoomType;
  currentKeyVersion: number;
  rekeyRequired: boolean;
  activeMembership: boolean;
  roomMembersDataList: RoomMemberData[];

  unreadCount?: number;
};