import type { RoomDataResponse } from "./chat";

export type KeyEnvelopeAvailablePayload = {
  roomId: number;
  version: number;
};

export type MessageCreatedInfo = {
  roomId: number;
}

export type GroupMemberRemovedPayload = {
  roomId: number;
  removedUsername: string;
}

export type RemovedFromGroupPayload = {
  roomId: number;
}

export type GroupMemberAddedPayload = {
  roomData: RoomDataResponse;
}

export type GroupMemberLeftPayload = {
  roomId: number;
  leftUsername: string;
  rekeyRequired: boolean;
}

export type GroupNameChangedPayload = {
  roomId: number;
  newName: string;
}

export type ConversationCreatedPayload = {
  roomData: RoomDataResponse;
}

export type WsEvent =
  | {
      type: "conversation.created";
      payload: ConversationCreatedPayload;
    }
  | {
      type: "key.envelope.available";
      payload: KeyEnvelopeAvailablePayload;
    }
  | {
      type: "group.member.added";
      payload: GroupMemberAddedPayload;
    }
  | {
      type: "group.member.left";
      payload: GroupMemberLeftPayload;
    }
  | {
      type: "group.member.removed";
      payload: GroupMemberRemovedPayload;
    }
  | {
      type: "removed.from.group";
      payload: RemovedFromGroupPayload;
    }
  | {
      type: "group.name.changed";
      payload: GroupNameChangedPayload;
    }
  | {
      type: "message.created.info";
      payload: MessageCreatedInfo;
    }
  | {
      type: "message.created";
      payload: {
        id: number;
        roomId: number;
        senderId: number | null;
        sender: string | null;
        createdAt: string;
        keyVersion: number | null;
        ciphertextB64: string | null;
        ivB64: string | null;
        aadB64: string | null;
        type: "CHAT" | "SYSTEM";
        systemText: string | null;
      };
    };