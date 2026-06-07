import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(onEvent) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io({ auth: { token } });
    socketRef.current = socket;

    if (onEvent) {
      for (const [event, handler] of Object.entries(onEvent)) {
        socket.on(event, handler);
      }
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
