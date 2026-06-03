type MessageInputProps = {
  value: string;
  connected: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function MessageInput({
  value,
  connected,
  onChange,
  onSend,
}: MessageInputProps) {
  return (
    <div className="chat-input">
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type message…"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
      />

      <button
        className="send"
        type="button"
        disabled={!value.trim() || !connected}
        onClick={onSend}
      >
        Send
      </button>
    </div>
  );
}