import type { UploadRoomKeysApiRequest } from "./chatDtos";
import type {
  CreateDmRequest,
  MyKeyResponse,
  RoomDataResponse,
} from "@/types/chat";
import type { CreateGroupRoomRequest } from "@/types/groupChat";
import type { WsNewMessage } from "@/types/ws";
import { apiDelete, apiFetch, postJson } from "./client";

export async function createOrGetPrivateConversation(req: CreateDmRequest) {
  return postJson<RoomDataResponse>("api/rooms/private-chat", req);
}

export async function getRecentConversations() {
  return apiFetch<RoomDataResponse[]>("/rooms/recent");
}



export async function uploadKeys(
  roomId: number,
  request: UploadRoomKeysApiRequest,
) {
  return postJson<string>(`api/rooms/${roomId}/keys/upload`, request);
}

export async function uploadRoomKeysForRekey(
  roomId: number,
  request: UploadRoomKeysApiRequest,
) {
  return postJson<string>(`api/rooms/${roomId}/keys/rekey`, request);
}

export async function getRoomKeyForRoom(roomId: number, version: number) {
  return apiFetch<MyKeyResponse>(`/rooms/${roomId}/my-key?version=${version}`);
}



export async function getAllRoomKeysForRoom(roomId: number) {
  return apiFetch<MyKeyResponse[]>(`/rooms/${roomId}/my-keys`);
}

export async function getMessagesForRoom(roomId: number) {
  return apiFetch<WsNewMessage>(`/rooms/${roomId}/messages`);
}



export async function createNewGroupChat(request: CreateGroupRoomRequest) {
  return postJson<RoomDataResponse>("api/rooms/group", request);
}

export async function updateGroupName(roomId: number, name: string) {
  return postJson<RoomDataResponse>(`api/rooms/${roomId}/name`, { name: name });
}

export async function addMemberToGroup(roomId: number, userId: number) {
  return postJson<RoomDataResponse>(`api/rooms/${roomId}/members`, {
    userId: userId,
  });
}

export async function removeMemberFromGroup(roomId: number, userId: number) {
  return apiDelete<RoomDataResponse>(`api/rooms/${roomId}/members`, {
    userId: userId,
  });
}

export async function leaveGroupApi(roomId: number) {
  return apiDelete<RoomDataResponse>(`api/rooms/${roomId}/leave`, {});
}