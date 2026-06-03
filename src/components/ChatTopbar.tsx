type ChatTopbarProps = {
  appName: string;
  usernameInitial: string;
  connected: boolean;
  onLogout: () => void;
};

export function ChatTopbar({
  appName,
  usernameInitial,
  connected,
  onLogout,
}: ChatTopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="app-badge">
          <div className="app-dot" />
          <div className="app-name">{appName}</div>
        </div>

        <div className="ws-status">
          WS: {connected ? "connected" : "disconnected"}
        </div>
      </div>

      <div className="topbar-right">
        <div className="avatar">{usernameInitial}</div>

        <button className="btn btn-ghost" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}