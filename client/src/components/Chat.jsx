import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  getRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  getMessages,
} from "../api.js";
import RoomList from "./RoomList.jsx";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import Avatar from "./Avatar.jsx";

let socket = null;

const MAX_AVATARS_IN_HEADER = 4;

export default function Chat() {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    getRooms().then(setRooms).catch(console.error);
  }, []);

  useEffect(() => {
    socket = io({ auth: { token: localStorage.getItem("token") } });

    socket.on("room-members", (memberList) => setMembers(memberList));

    return () => { socket?.disconnect(); };
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    socket?.emit("join-room", activeRoom._id);
    setMessages([]);

    getMessages(activeRoom._id).then(setMessages).catch(console.error);
    getRoomMembers(activeRoom._id).then(setMembers).catch(console.error);

    return () => {
      socket?.emit("leave-room", activeRoom._id);
    };
  }, [activeRoom]);

  useEffect(() => {
    const handler = (msg) => {
      if (msg.room === activeRoom?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket?.on("new-message", handler);
    return () => socket?.off("new-message", handler);
  }, [activeRoom]);

  const handleCreateRoom = useCallback(async (name) => {
    const room = await createRoom(name);
    setRooms((prev) => [room, ...prev]);
    setActiveRoom(room);
    setSidebarOpen(false);
  }, []);

  const handleJoinRoom = useCallback(async (roomId) => {
    await joinRoom(roomId);
    socket?.emit("join-room", roomId);
    const room = rooms.find((r) => r._id === roomId);
    setActiveRoom(room);
    setSidebarOpen(false);
  }, [rooms]);

  const handleLeaveRoom = useCallback(async (roomId) => {
    await leaveRoom(roomId);
    socket?.emit("leave-room", roomId);
    setActiveRoom((prev) => (prev?._id === roomId ? null : prev));
    setRooms((prev) => prev.filter((r) => r._id !== roomId));
  }, []);

  const handleSendMessage = useCallback((content) => {
    if (!activeRoom) return;
    socket?.emit("send-message", { roomId: activeRoom._id, content });
  }, [activeRoom]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <div className="chat-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <RoomList
        rooms={rooms}
        activeRoom={activeRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        user={user}
        logout={logout}
        sidebarOpen={sidebarOpen}
      />

      <div className="main-area">
        {activeRoom ? (
          <>
            <div className="room-header">
              <div className="room-header-info">
                <button
                  className="mobile-menu-btn"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                </button>
                <div>
                  <h2>{activeRoom.name}</h2>
                  <div className="room-header-meta">
                    {members.length} {members.length === 1 ? "member" : "members"} · {onlineCount} online
                  </div>
                </div>
              </div>

              <div className="member-stack">
                {members.slice(0, MAX_AVATARS_IN_HEADER).map((m) => (
                  <Avatar key={m._id} username={m.username} size={28} />
                ))}
                {members.length > MAX_AVATARS_IN_HEADER && (
                  <div className="member-stack-more">
                    +{members.length - MAX_AVATARS_IN_HEADER}
                  </div>
                )}
              </div>
            </div>

            <MessageList messages={messages} userId={user?.id} />

            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <>
            <div className="room-header">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </div>
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="empty-state-title">Welcome, {user?.username}!</div>
              <div className="empty-state-text">
                Select a room from the sidebar to start chatting, or create a new one to bring your friends together.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
