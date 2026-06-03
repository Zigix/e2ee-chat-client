import { useState } from "react";
import type { UiMessage } from "../types/types";
import { MessageList } from "./MassageList";
import { MessageInput } from "./MessageInput";
import type { RoomDataResponse } from "../types/chat";

type ChatPanelProps = {
  conversation: RoomDataResponse;
  messages: UiMessage[];
  loading: boolean;
  connected: boolean;
  onClose: () => void;
  onSend: (text: string) => Promise<void>;
  onOpenGroupSettings: () => void;
};

export function ChatPanel({
  conversation,
  messages,
  loading,
  connected,
  onClose,
  onSend,
  onOpenGroupSettings,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const canSend = conversation.activeMembership;

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;

    await onSend(text);
    setDraft("");
  }

  return (
    <section className="chat">
      <div className="chat-header">
        <div>
          <div className="chat-title">{conversation.roomName}</div>
          <div className="chat-sub">
            {conversation.roomType === "GROUP"
              ? "Group chat"
              : "Private messages"}
          </div>
        </div>

        {conversation.roomType === "GROUP" && conversation.activeMembership && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onOpenGroupSettings}
          >
            Settings
          </button>
        )}

        <button className="btn btn-ghost" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <MessageList messages={messages} loading={loading} />

      {canSend ? (
        <MessageInput
          value={draft}
          connected={connected}
          onChange={setDraft}
          onSend={handleSend}
        />
      ) : (
        <div className="chat-disabled-info">
          You are no longer a member of this group. You can only view message
          history.
        </div>
      )}
    </section>
  );
}
