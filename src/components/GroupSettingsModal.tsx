import { useEffect, useMemo, useState } from "react";
import type { SearchUserResponse } from "../api/users";
import { searchUsers } from "../api/users";
import type { RoomDataResponse } from "../types/chat";

type GroupSettingsModalProps = {
  open: boolean;
  room: RoomDataResponse | null;
  myUserId: number;
  onClose: () => void;

  onRenameGroup: (roomId: number, name: string) => Promise<void>;
  onAddMember: (roomId: number, user: SearchUserResponse) => Promise<void>;
  onRemoveMember: (roomId: number, userId: number) => Promise<void>;
  onLeaveGroup: (roomId: number) => Promise<void>;
};

export function GroupSettingsModal({
  open,
  room,
  myUserId,
  onClose,
  onRenameGroup,
  onAddMember,
  onRemoveMember,
  onLeaveGroup,
}: GroupSettingsModalProps) {
  const [name, setName] = useState(room?.roomName ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const memberIds = useMemo(() => {
    return new Set(room?.roomMembersDataList.map((m) => m.userId) ?? []);
  }, [room]);

  useEffect(() => {
    if (room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(room.roomName);
    }
  }, [room]);

  if (!open || !room) return null;

  const currentRoom = room;

  const me = currentRoom.roomMembersDataList.find((m) => m.userId === myUserId);
  const isAdmin = me?.role === "ADMIN";  

  async function handleSearch(value: string) {
    setQuery(value);

    const q = value.trim();
    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const users = await searchUsers(q);
      setResults(users.filter((u) => !memberIds.has(u.id)));
    } finally {
      setLoading(false);
    }
  }

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentRoom.roomName) return;

    await onRenameGroup(currentRoom.roomId, trimmed);
  }

  async function handleAdd(user: SearchUserResponse) {
    await onAddMember(currentRoom.roomId, user);

    setQuery("");
    setResults([]);
    setSearchOpen(false);
  }

  async function handleRemove(userId: number) {
    await onRemoveMember(currentRoom.roomId, userId);
  }

  async function handleLeave() {
    await onLeaveGroup(currentRoom.roomId);
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="group-settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="group-settings-header">
          <h2>Group settings</h2>

          <button className="modal-x" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="group-settings-section">
          <label className="group-settings-label">Group name</label>

          <div className="group-name-edit-row">
            <input
              className="group-name-input"
              value={name}
              disabled={!isAdmin}
              onChange={(e) => setName(e.target.value)}
            />

            {isAdmin && (
              <button
                className="btn btn-ghost"
                type="button"
                disabled={!name.trim() || name.trim() === room.roomName}
                onClick={handleRename}
              >
                Save
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="group-hint">
              Only admin can change group name.
            </div>
          )}
        </div>

        <div className="group-settings-section">
          <div className="group-settings-title-row">
            <div className="group-settings-title">Members</div>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
            >
              Add +
            </button>
          </div>

          {searchOpen && (
            <div className="group-search-box">
              <input
                className="group-search-input"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search user..."
                autoFocus
              />

              <div className="group-search-results">
                {loading && <div className="group-search-empty">Searching...</div>}

                {!loading && query && results.length === 0 && (
                  <div className="group-search-empty">No users found</div>
                )}

                {!loading &&
                  results.map((user) => (
                    <button
                      key={user.id}
                      className="group-search-result"
                      type="button"
                      onClick={() => handleAdd(user)}
                    >
                      <div className="group-user-avatar">
                        {user.username.slice(0, 1).toUpperCase()}
                      </div>

                      <span>{user.username}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="group-member-list">
            {room.roomMembersDataList.map((member) => {
              const isMe = member.userId === myUserId;
              const canRemove = isAdmin && !isMe;

              return (
                <div key={member.userId} className="group-member-row">
                  <div className="group-member-info">
                    <div className="group-user-avatar">
                      {member.username.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <div className="group-member-name">
                        {member.username}
                        {isMe ? " (you)" : ""}
                      </div>

                      <div className={`group-role ${member.role.toLowerCase()}`}>
                        {member.role}
                      </div>
                    </div>
                  </div>

                  {canRemove && (
                    <button
                      className="group-remove-btn"
                      type="button"
                      onClick={() => handleRemove(member.userId)}
                    >
                      −
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="group-danger-zone">
          <button className="btn btn-ghost danger" type="button" onClick={handleLeave}>
            Leave group
          </button>

        </div>
      </div>
    </div>
  );
}