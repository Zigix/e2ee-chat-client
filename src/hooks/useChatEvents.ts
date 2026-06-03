// src/hooks/useChatEvents.ts

import { useEffect } from "react";
import { subscribeToWs } from "../services/wsService";
import { fetchAndStoreMyRoomKey } from "../services/chatService";
import { incrementUnread, upsertConversation } from "../utils/utilities";
import type { RoomDataResponse } from "../types/chat";
import { tryPerformRekey } from "../services/roomKeyService";
import { getCryptoSession } from "@/state/cryptoSession";

type UseChatEventsArgs = {
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  conversations: RoomDataResponse[];
  setConversations: React.Dispatch<React.SetStateAction<RoomDataResponse[]>>;
};

export function useChatEvents({
  selectedId,
  setSelectedId,
  conversations,
  setConversations,
}: UseChatEventsArgs) {
  useEffect(() => {
    return subscribeToWs(async (event) => {
      switch (event.type) {
        case "conversation.created": {
          const conversation: RoomDataResponse = event.payload.roomData;

          setConversations((prev) => upsertConversation(prev, conversation));

          break;
        }

        case "key.envelope.available": {
          const { roomId, version } = event.payload;

          try {
            await fetchAndStoreMyRoomKey(roomId, version);
          } catch (e) {
            console.error("Failed to fetch new room key", e);
          }

          break;
        }

        case "group.member.added": {
          const payload = event.payload;

          setConversations((prev) =>
            upsertConversation(prev, payload.roomData),
          );

          break;
        }

        case "group.member.removed": {
          const payload = event.payload;

          const conversation = conversations.find(
            (c) => c.roomId === payload.roomId,
          );

          if (conversation) {
            const updatedConversation = {
              ...conversation,
              roomMembersDataList: conversation.roomMembersDataList.filter(
                (m) => m.username !== payload.removedUsername,
              ),
            };

            setConversations((prev) =>
              upsertConversation(prev, updatedConversation),
            );
          }

          break;
        }

        case "removed.from.group": {
          const payload = event.payload;

          const myUserId = getCryptoSession().myUserId;

          const conversation = conversations.find(
            (c) => c.roomId === payload.roomId,
          );

          if (conversation) {
            const updatedConversation = {
              ...conversation,
              roomMembersDataList: conversation.roomMembersDataList.filter(
                (m) => m.userId !== myUserId,
              ),
              activeMembership: false,
            };

            setConversations((prev) =>
              upsertConversation(prev, updatedConversation),
            );
          }
          break;
        }

        case "group.member.left": {
          const payload = event.payload;

          const conversation = conversations.find(
            (c) => c.roomId === payload.roomId,
          );

          if (conversation) {
            const updatedConversation = {
              ...conversation,
              rekeyRequired: payload.rekeyRequired,
              roomMembersDataList: conversation.roomMembersDataList.filter(
                (m) => m.username !== payload.leftUsername,
              ),
            };

            setConversations((prev) =>
              upsertConversation(prev, updatedConversation),
            );
            await tryPerformRekey(updatedConversation);
          }

          break;
        }

        case "group.name.changed": {
          const payload = event.payload;

          const conversation = conversations.find(
            (c) => c.roomId === payload.roomId,
          );

          if (conversation) {
            const updatedConversation = {
              ...conversation,
              roomName: payload.newName
            };

            setConversations((prev) => upsertConversation(prev, updatedConversation));
          }

          break;
        }

        case "message.created.info": {
          const roomId = event.payload.roomId;

          setConversations((prev) => {
            if (selectedId === roomId) {
              return prev;
            }

            return incrementUnread(prev, roomId);
          });
        }
      }
    });
  }, [selectedId, setSelectedId, conversations, setConversations]);
}
