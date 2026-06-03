import type { RoomDataResponse } from "../types/chat";
import { ConversationItem } from "./ConversationItem";

type ConversationSidebarProps = {
  conversations: RoomDataResponse[];
  totalCount: number;
  selectedId: number | null;
  hasSelected: boolean;
  onSelect: (id: number) => void;
};

export function ConversationSidebar({
  conversations,
  totalCount,
  selectedId,
  hasSelected,
  onSelect,
}: ConversationSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          {hasSelected ? "Chats" : "Last chats"}
        </div>

        <div className="pill">{totalCount}</div>
      </div>

      <div className="list">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.roomId}
            conversation={conversation}
            active={selectedId === conversation.roomId}
            onClick={() => onSelect(conversation.roomId)}
          />
        ))}
      </div>
    </aside>
  );
}