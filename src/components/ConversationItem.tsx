import type { RoomDataResponse } from "../types/chat";

type ConversationItemProps = {
  conversation: RoomDataResponse;
  active: boolean;
  onClick: () => void;
};

export function ConversationItem({
  conversation,
  active,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      className={`conv ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="conv-avatar">
        {conversation.roomName.slice(0, 1).toUpperCase()}
      </div>

      <div className="conv-main">
        <div className="conv-name">{conversation.roomName}</div>
      </div>

      {(conversation.unreadCount ?? 0) > 0 && (
        <div className="unread-badge">{conversation.unreadCount}</div>
      )}
    </button>
  );
}
