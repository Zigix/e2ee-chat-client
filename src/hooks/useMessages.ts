// chat/hooks/useMessages.ts

import { useEffect, useState } from "react";
import {
  sendRoomMessage,
  subscribeToRoom,
  unsubscribeFromRoom,
  subscribeToWs,
} from "../services/wsService";
import { encryptForRoom, tryDecryptMessage } from "../services/cryptoService";
import type { EncryptedMessageDto, UiMessage } from "../types/types";
import { getMessagesForRoom } from "../api/chat";

export function useMessages(
  roomId: number | null,
  myUserId: number,
  activeMembership: boolean,
  wsConnected: boolean,
) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. LOAD HISTORY
  useEffect(() => {
    if (!roomId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }

    const currentRoomId = roomId;
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);

      try {
        const res = await getMessagesForRoom(currentRoomId);
        const encryptedMessages = res as unknown as EncryptedMessageDto[];

        const mapped = await Promise.all(
          encryptedMessages.map((m) => mapMessageDtoToUiMessage(m, myUserId)),
        );

        const decrypted = mapped.filter((m): m is UiMessage => m !== null);

        if (!cancelled) {
          setMessages(decrypted);
        }
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [roomId, myUserId]);

  // 2. REAL-TIME WS
  useEffect(() => {
    if (!roomId) return;
    if (!wsConnected) return;
    if (!activeMembership) {
      unsubscribeFromRoom(roomId);
      return;
    }

    // STOMP subscription for this room
    subscribeToRoom(roomId);

    const unsubscribe = subscribeToWs(async (event) => {
  if (event.type !== "message.created") return;

  const m: EncryptedMessageDto = event.payload;

  if (m.roomId !== roomId) return;

  try {
    const uiMessage = await mapMessageDtoToUiMessage(m, myUserId);

    if (!uiMessage) return;

    setMessages((prev) => {
      if (prev.some((x) => x.id === uiMessage.id)) return prev;

      return [...prev, uiMessage];
    });
  } catch (e) {
    console.error("Decrypt failed", e);
  }
});

    return () => {
      unsubscribe();
      unsubscribeFromRoom(roomId);
    };
  }, [roomId, myUserId, wsConnected, activeMembership]);

  // 3. SEND MESSAGE
  async function sendMessage(text: string) {
    if (!roomId) return;

    try {
      const encrypted = await encryptForRoom(roomId, text);

      sendRoomMessage(roomId, {
        ...encrypted,
      });
    } catch (e) {
      console.error("Send message failed", e);
    }
  }

  return {
    messages,
    loading,
    sendMessage,
  };
}

async function mapMessageDtoToUiMessage(
  m: EncryptedMessageDto,
  myUserId: number,
): Promise<UiMessage | null> {
  if (m.type === "SYSTEM") {
    return {
      id: m.id,
      roomId: m.roomId,
      type: "SYSTEM",
      createdAt: m.createdAt,
      text: m.systemText ?? "",
    };
  }

  try {
    const messageText = await tryDecryptMessage(m.roomId, m);

    if (!messageText) {
      return null;
    }

    return {
      id: m.id,
      roomId: m.roomId,
      type: "CHAT",
      senderId: m.senderId!,
      sender: m.sender!,
      createdAt: m.createdAt,
      fromMe: m.senderId === myUserId,
      text: messageText,
    };
  } catch {
    return null;
  }

}
