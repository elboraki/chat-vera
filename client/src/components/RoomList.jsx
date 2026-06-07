import { useState } from "react";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import Footer from "./Footer.jsx";

export default function RoomList({
  rooms,
  activeRoom,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  user,
  logout,
  sidebarOpen = false,
}) {
  const [name, setName] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateRoom(name.trim());
    setName("");
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <Logo size={36} className="brand-logo-svg" />
        <div className="brand-name">VeraChat</div>
      </div>

      <div className="sidebar-user">
        <Avatar username={user?.username} size={36} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.username}</div>
          <div className="sidebar-user-status">Online</div>
        </div>
        <button
          className="btn-icon"
          onClick={logout}
          aria-label="Logout"
          title="Logout"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <form className="create-room" onSubmit={handleCreate}>
        <input
          placeholder="New room name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
        />
        <button type="submit" className="btn-create" disabled={!name.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Room
        </button>
      </form>

      <div className="sidebar-section">
        <span>Rooms</span>
        <span className="sidebar-section-count">{rooms.length}</span>
      </div>

      <ul className="room-list">
        {rooms.length === 0 && (
          <li style={{ padding: "0.75rem 0.5rem", color: "var(--text-4)", fontSize: "0.85rem", textAlign: "center" }}>
            No rooms yet
          </li>
        )}
        {rooms.map((room) => {
          const isActive = activeRoom?._id === room._id;
          return (
            <li
              key={room._id}
              className={`room-item ${isActive ? "active" : ""}`}
              onClick={() => !isActive && onJoinRoom(room._id)}
            >
              <span className="room-hash">#</span>
              <span className="room-name">{room.name}</span>
              <span className="room-count">{room.memberCount}</span>
              {isActive && (
                <button
                  className="btn-leave"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeaveRoom(room._id);
                  }}
                  title="Leave room"
                  aria-label="Leave room"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Footer variant="sidebar" />
    </aside>
  );
}
