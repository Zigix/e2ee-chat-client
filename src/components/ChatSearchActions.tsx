type ChatSearchActionsProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onNewConversation: () => void;
  onNewGroup: () => void;
};

export function ChatSearchActions({
  query,
  onQueryChange,
  onNewConversation,
  onNewGroup,
}: ChatSearchActionsProps) {
  return (
    <div className="search-row">
      <div className="search-wrap">
        <input
          className="search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for user or group"
        />

        <button className="btn btn-ghost" type="button" onClick={onNewConversation}>
          New conversation
        </button>

        <button className="btn btn-ghost" type="button" onClick={onNewGroup}>
          New group
        </button>
      </div>
    </div>
  );
}