import { useMemo, useState } from "react";
import { NewConversationModal } from "../components/NewConversationModal";
import { NewGroupModal } from "../components/NewGroupModal";
import type { SearchUserResponse } from "../api/users";
import { useWebSocket } from "../hooks/useWebSocket";
import { useChat } from "../hooks/useChat";
import { useMessages } from "../hooks/useMessages";

import { ChatTopbar } from "../components/ChatTopbar";
import { ChatSearchActions } from "../components/ChatSearchActions";
import { ConversationSidebar } from "../components/ConversationSidebar";
import { ChatPanel } from "../components/ChatPanel";
import { clearCryptoSession, getCryptoSession } from "../state/cryptoSession";
import { GroupSettingsModal } from "../components/GroupSettingsModal";
import { disconnectWs } from "../services/wsService";
import { clearRoomKeys } from "../state/roomKeysStore";

type ChatHomePageProps = {
  appName: string;
  usernameInitial: string;
  onLogout: () => void;
};

export function ChatHomePage({
  appName,
  usernameInitial,
  onLogout,
}: ChatHomePageProps) {
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

  const token = localStorage.getItem("accessToken");
  const { connected } = useWebSocket(token);

  const myUserId = getCryptoSession().myUserId;

  const {
    conversations,
    selected,
    selectedId,
    setSelectedId,
    startPrivateConversation,
    createGroupChat,
    renameGroup,
    addGroupMember,
    removeGroupMember,
    leaveGroup,
    deleteGroup,
  } = useChat();

  const { messages, loading, sendMessage } = useMessages(
    selectedId,
    myUserId,
    selected?.activeMembership ?? false,
    connected,
  );

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((c) => c.roomName.toLowerCase().includes(q));
  }, [query, conversations]);

  async function handlePickUser(user: SearchUserResponse) {
    await startPrivateConversation(user);
    setNewConversationOpen(false);
  }

  function handleLogout() {
    disconnectWs();

    clearRoomKeys();
    clearCryptoSession();

    localStorage.removeItem("accessToken");

    onLogout();
  }

  return (
    <div className="chat-page">
      <ChatTopbar
        appName={appName}
        usernameInitial={usernameInitial}
        connected={connected}
        onLogout={handleLogout}
      />

      <ChatSearchActions
        query={query}
        onQueryChange={setQuery}
        onNewConversation={() => setNewConversationOpen(true)}
        onNewGroup={() => setNewGroupOpen(true)}
      />

      <div className="main">
        <div className={`shell ${selected ? "with-chat" : "no-chat"}`}>
          <ConversationSidebar
            conversations={filteredConversations}
            totalCount={conversations.length}
            selectedId={selectedId}
            hasSelected={Boolean(selected)}
            onSelect={setSelectedId}
          />

          {selected && (
            <ChatPanel
              conversation={selected}
              messages={messages}
              loading={loading}
              connected={connected}
              onClose={() => setSelectedId(null)}
              onSend={sendMessage}
              onOpenGroupSettings={() => setGroupSettingsOpen(true)}
            />
          )}
        </div>
      </div>

      <NewConversationModal
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        onPickUser={handlePickUser}
      />

      <NewGroupModal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        onCreateGroup={async ({ name, members }) => {
          await createGroupChat({
            name,
            userIds: members.map((m) => m.id),
          });

          setNewGroupOpen(false);
        }}
      />

      <GroupSettingsModal
        open={groupSettingsOpen}
        room={selected?.roomType === "GROUP" ? selected : null}
        myUserId={myUserId}
        onClose={() => setGroupSettingsOpen(false)}
        onRenameGroup={renameGroup}
        onAddMember={addGroupMember}
        onRemoveMember={removeGroupMember}
        onLeaveGroup={leaveGroup}
        onDeleteGroup={deleteGroup}
      />
    </div>
  );
}
