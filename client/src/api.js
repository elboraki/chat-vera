const BASE = "/api";

function headers() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(url, { headers: headers(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const register = (username, password) =>
  request(`${BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const login = (username, password) =>
  request(`${BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const getMe = () => request(`${BASE}/auth/me`);

// Rooms
export const getRooms = () => request(`${BASE}/rooms`);

export const createRoom = (name) =>
  request(`${BASE}/rooms`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const joinRoom = (id) =>
  request(`${BASE}/rooms/${id}/join`, { method: "POST" });

export const leaveRoom = (id) =>
  request(`${BASE}/rooms/${id}/leave`, { method: "POST" });

export const getRoomMembers = (id) => request(`${BASE}/rooms/${id}/members`);

export const getMessages = (id) => request(`${BASE}/rooms/${id}/messages`);
