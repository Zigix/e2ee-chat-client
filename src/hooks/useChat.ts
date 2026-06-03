import { useEffect, useMemo, useState } from "react";
import {
  createGroupChatService,
  createPrivateRoom,
  fetchAndStoreAllMyRoomKeysForRoom,
} from "../services/chatService";
import { setupRoomKeyForRoom, tryPerformRekey } from "../services/roomKeyService";
import {
  addMemberToGroup,
  getRecentConversations,
  leaveGroupApi,
  removeMemberFromGroup,
  updateGroupName,
} from "../api/chat";
import type { CreateGroupRoomRequest } from "../types/groupChat";
import { useChatEvents } from "./useChatEvents";
import { clearUnread, upsertConversation } from "../utils/utilities";
import type { RoomDataResponse } from "../types/chat";
import type { SearchUserResponse } from "../api/users";

export function useChat() {
  const [conversations, setConversations] = useState<RoomDataResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = useMemo(
    () => conversations.find((c) => c.roomId === selectedId) ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    async function loadConversations() {
      const recentConversations = await getRecentConversations();

      for (const conv of recentConversations) {
        if (conv.activeMembership && conv.rekeyRequired) {
          await tryPerformRekey(conv);
        }
        fetchAndStoreAllMyRoomKeysForRoom(conv.roomId);
      }

      setConversations(recentConversations);
    }

    loadConversations();
  }, []);

  useChatEvents({
    selectedId,
    setSelectedId: selectConversation,
    conversations,
    setConversations,
  });

  async function startPrivateConversation(user: {
    id: number;
    username: string;
  }) {
    const conversation: RoomDataResponse = await createPrivateRoom(user.id);

    try {
      await fetchAndStoreAllMyRoomKeysForRoom(conversation.roomId);
    } catch (err: unknown) {
      console.log(err);
    }

    try {
      await setupRoomKeyForRoom({
        roomId: conversation.roomId,
        version: conversation.currentKeyVersion,
        members: conversation.roomMembersDataList,
      });
    } catch (err: unknown) {
      console.log(err);
    }

    setConversations((prev) => upsertConversation(prev, conversation));

    selectConversation(conversation.roomId);
  }

  async function createGroupChat(groupDetails: CreateGroupRoomRequest) {
    const conversation = await createGroupChatService(groupDetails);

    try {
      await setupRoomKeyForRoom({
        roomId: conversation.roomId,
        version: conversation.currentKeyVersion,
        members: conversation.roomMembersDataList,
      });
    } catch (err: unknown) {
      console.log(err);
    }

    setConversations((prev) => upsertConversation(prev, conversation));

    selectConversation(conversation.roomId);
  }

  async function renameGroup(roomId: number, name: string) {
    const updatedRoom = await updateGroupName(roomId, name);

    setConversations((prev) => upsertConversation(prev, updatedRoom));
  }

  async function addGroupMember(roomId: number, user: SearchUserResponse) {
    const updatedRoom = await addMemberToGroup(roomId, user.id);

    await setupRoomKeyForRoom({
      roomId: updatedRoom.roomId,
      version: updatedRoom.currentKeyVersion,
      members: updatedRoom.roomMembersDataList,
    });

    setConversations((prev) => upsertConversation(prev, updatedRoom));
  }

  async function removeGroupMember(roomId: number, userId: number) {
    const updatedRoom = await removeMemberFromGroup(roomId, userId);

    await setupRoomKeyForRoom({
      roomId: updatedRoom.roomId,
      version: updatedRoom.currentKeyVersion,
      members: updatedRoom.roomMembersDataList,
    });

    setConversations((prev) => upsertConversation(prev, updatedRoom));
  }

  async function leaveGroup(roomId: number) {
    const conversationAfterLeave = await leaveGroupApi(roomId);

    setConversations((prev) => upsertConversation(prev, conversationAfterLeave));
  }

  function selectConversation(roomId: number | null) {
  setSelectedId(roomId);

  if (roomId !== null) {
    setConversations((prev) => clearUnread(prev, roomId));
  }
}

  return {
    conversations,
    selected,
    selectedId,
    setSelectedId: selectConversation,
    startPrivateConversation,
    createGroupChat,

    renameGroup,
    addGroupMember,
    removeGroupMember,
    leaveGroup
  };
}
