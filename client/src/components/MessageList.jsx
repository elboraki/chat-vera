import { useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";

const GROUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d) {
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function getMessageUserId(msg) {
  return typeof msg.user === "object" ? msg.user?._id : msg.user;
}

export default function MessageList({ messages, userId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="empty-messages">
          <div className="empty-messages-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div>No messages yet.</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-4)" }}>
            Be the first to say hello!
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  // Pre-compute grouping & date separators
  const items = [];
  let lastDateKey = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const date = new Date(msg.createdAt);
    const dateKey = date.toDateString();

    if (dateKey !== lastDateKey) {
      items.push({ type: "date", key: `d-${dateKey}`, date });
      lastDateKey = dateKey;
    }

    const msgUid = getMessageUserId(msg);
    const prevUid = prev ? getMessageUserId(prev) : null;
    const nextUid = next ? getMessageUserId(next) : null;

    const prevDate = prev ? new Date(prev.createdAt) : null;
    const nextDate = next ? new Date(next.createdAt) : null;

    const sameDayAsPrev = prev && prevDate.toDateString() === dateKey;
    const sameDayAsNext = next && nextDate.toDateString() === dateKey;

    const groupStart =
      !prev ||
      prevUid !== msgUid ||
      !sameDayAsPrev ||
      date - prevDate > GROUP_WINDOW_MS;

    const groupEnd =
      !next ||
      nextUid !== msgUid ||
      !sameDayAsNext ||
      nextDate - date > GROUP_WINDOW_MS;

    items.push({
      type: "message",
      key: msg._id,
      msg,
      groupStart,
      groupEnd,
      isOwn: msgUid === userId,
    });
  }

  return (
    <div className="message-list">
      {items.map((item) => {
        if (item.type === "date") {
          return (
            <div key={item.key} className="date-separator">
              <span>{formatDate(item.date)}</span>
            </div>
          );
        }

        const { msg, groupStart, groupEnd, isOwn } = item;
        const classes = [
          "message-row",
          isOwn ? "own" : "other",
          groupStart ? "group-start" : "",
          groupEnd ? "group-end" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={item.key} className={classes}>
            {!isOwn && (
              <div className="avatar-slot">
                <Avatar username={msg.username} size={36} />
              </div>
            )}
            <div className="message-content">
              {!isOwn && groupStart && (
                <div className="message-header">
                  <span className="message-author">{msg.username}</span>
                  <span className="message-time">{formatTime(new Date(msg.createdAt))}</span>
                </div>
              )}
              <div className="message-bubble" title={formatTime(new Date(msg.createdAt))}>
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
