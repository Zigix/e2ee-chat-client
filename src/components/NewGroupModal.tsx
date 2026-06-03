import { useMemo, useState } from "react";
import type { SearchUserResponse } from "../api/users";
import { searchUsers } from "../api/users";

type NewGroupModalProps = {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (data: {
    name: string;
    members: SearchUserResponse[];
  }) => void | Promise<void>;
};

export function NewGroupModal({
  open,
  onClose,
  onCreateGroup,
}: NewGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<SearchUserResponse[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const canCreate = groupName.trim() && members.length > 0;

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  if (!open) return null;

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
    } catch (e) {
      console.error("Failed to search users", e);
    } finally {
      setLoading(false);
    }
  }

  function addMember(user: SearchUserResponse) {
    setMembers((prev) => {
      if (prev.some((m) => m.id === user.id)) return prev;
      return [...prev, user];
    });

    setQuery("");
    setResults([]);
    setAddOpen(false);
  }

  function removeMember(userId: number) {
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  }

  async function handleCreate() {
    if (!canCreate) return;

    await onCreateGroup({
      name: groupName.trim(),
      members,
    });

    setGroupName("");
    setMembers([]);
    setQuery("");
    setResults([]);
    setAddOpen(false);
    onClose();
  }

  function handleClose() {
    setAddOpen(false);
    setQuery("");
    setResults([]);
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <div className="group-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h2>New Group</h2>

          <button className="modal-x" type="button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="group-name-row">
          <label>Name:</label>

          <input
            className="group-name-input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
          />
        </div>

        <div className="group-members-title">Members</div>

        <button
          className="group-add-btn"
          type="button"
          onClick={() => setAddOpen(true)}
        >
          <span>Add</span>
          <span className="group-plus">+</span>
        </button>

        {addOpen && (
          <div className="group-search-box">
            <input
              className="group-search-input"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search user..."
              autoFocus
            />

            <div className="group-search-results">
              {loading && (
                <div className="group-search-empty">Searching...</div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="group-search-empty">No users found</div>
              )}

              {!loading &&
                results.map((user) => (
                  <button
                    key={user.id}
                    className="group-search-result"
                    type="button"
                    onClick={() => addMember(user)}
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
          {members.length === 0 && (
            <div className="group-empty-members">No members added yet</div>
          )}

          {members.map((member) => (
            <div key={member.id} className="group-member-row">
              <div className="group-member-info">
                <div className="group-user-avatar">
                  {member.username.slice(0, 1).toUpperCase()}
                </div>

                <span>{member.username}</span>
              </div>

              <button
                className="group-remove-btn"
                type="button"
                onClick={() => removeMember(member.id)}
                aria-label={`Remove ${member.username}`}
              >
                −
              </button>
            </div>
          ))}
        </div>

        <div className="group-modal-actions">
          <button className="btn btn-ghost" type="button" onClick={handleClose}>
            Cancel
          </button>

          <button
            className="send"
            type="button"
            disabled={!canCreate}
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
