import type { UiMessage } from "../types/types";

type MessageListProps = {
  messages: UiMessage[];
  loading: boolean;
};

export function MessageList({ messages, loading }: MessageListProps) {
  function formatMessageTime(date: string | Date) {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <div className="chat-body">
      {loading && <div className="chat-sub">Loading messages…</div>}

      {!loading &&
        messages.map((message) => {
          if (message.type === "SYSTEM") {
            return (
              <div key={message.id} className="system-message-wrap">
                <div className="system-line" />

                <div className="system-message">{message.text}</div>

                <div className="system-line" />
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`message-wrap ${message.fromMe ? "me" : "them"}`}
            >
              <div className="message-meta">
                <span className="message-author">{message.sender}</span>
                <span className="message-time">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>

              <div className={`bubble ${message.fromMe ? "me" : "them"}`}>
                {message.text}
              </div>
            </div>
          );
        })}
    </div>
  );
}
