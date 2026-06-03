export type EncryptedMessageDto = {
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

export type UiChatMessage = {
  id: number;
  roomId: number;
  type: "CHAT";
  senderId: number;
  sender: string;
  text: string;
  createdAt: string;
  fromMe: boolean;
};

export type UiSystemMessage = {
  id: number;
  roomId: number;
  type: "SYSTEM";
  text: string;
  createdAt: string;
};

export type UiMessage = UiChatMessage | UiSystemMessage;