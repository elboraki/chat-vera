import jwt from "jsonwebtoken";
import Room from "./models/Room.js";
import Message from "./models/Message.js";

const onlineUsers = new Map();

export function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    onlineUsers.set(user.id, socket.id);

    // Join a room (subscribe to socket room + DB)
    socket.on("join-room", async (roomId) => {
      socket.join(roomId);

      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const already = room.members.find(
          (m) => m.user.toString() === user.id
        );
        if (!already) {
          room.members.push({ user: user.id });
          await room.save();
        }

        await emitMembers(io, roomId);
      } catch (err) {
        console.error("join-room error:", err.message);
      }
    });

    // Leave a room
    socket.on("leave-room", async (roomId) => {
      socket.leave(roomId);

      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.members = room.members.filter(
          (m) => m.user.toString() !== user.id
        );
        await room.save();

        await emitMembers(io, roomId);
      } catch (err) {
        console.error("leave-room error:", err.message);
      }
    });

    // Send message
    socket.on("send-message", async ({ roomId, content }) => {
      if (!content?.trim() || !roomId) return;

      try {
        const msg = await Message.create({
          room: roomId,
          user: user.id,
          username: user.username,
          content: content.trim(),
        });

        io.to(roomId).emit("new-message", {
          _id: msg._id,
          room: msg.room,
          user: msg.user,
          username: msg.username,
          content: msg.content,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error("send-message error:", err.message);
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(user.id);

      // Remove from all rooms
      try {
        const rooms = await Room.find({ "members.user": user.id });
        for (const room of rooms) {
          room.members = room.members.filter(
            (m) => m.user.toString() !== user.id
          );
          await room.save();
          await emitMembers(io, room._id.toString());
        }
      } catch (err) {
        console.error("disconnect error:", err.message);
      }
    });
  });
}

async function emitMembers(io, roomId) {
  try {
    const room = await Room.findById(roomId).populate("members.user", "username");
    if (!room) return;

    const members = room.members.map((m) => ({
      _id: m.user._id,
      username: m.user.username,
      online: onlineUsers.has(m.user._id.toString()),
    }));

    io.to(roomId).emit("room-members", members);
  } catch (err) {
    console.error("emitMembers error:", err.message);
  }
}
