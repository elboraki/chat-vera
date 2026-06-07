import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import Room from "../models/Room.js";
import Message from "../models/Message.js";

const router = Router();
router.use(authenticate);

// GET /api/rooms — list all rooms with member count
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find()
      .select("name createdBy members createdAt")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const list = rooms.map((r) => ({
      _id: r._id,
      name: r.name,
      createdBy: r.createdBy?.username || "unknown",
      memberCount: r.members.length,
      createdAt: r.createdAt,
    }));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms — create a new room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Room name required" });

    const existing = await Room.findOne({ name });
    if (existing) return res.status(409).json({ error: "Room already exists" });

    const room = await Room.create({
      name,
      createdBy: req.user.id,
      members: [{ user: req.user.id }],
    });

    res.status(201).json({
      _id: room._id,
      name: room.name,
      createdBy: req.user.username,
      memberCount: 1,
      createdAt: room.createdAt,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: "Room already exists" });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/join — join a room
router.post("/:id/join", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const already = room.members.find(
      (m) => m.user.toString() === req.user.id
    );
    if (already) return res.json({ message: "Already a member" });

    room.members.push({ user: req.user.id });
    await room.save();

    res.json({ message: "Joined room" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:id/leave — leave a room
router.post("/:id/leave", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.members = room.members.filter(
      (m) => m.user.toString() !== req.user.id
    );
    await room.save();

    res.json({ message: "Left room" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id/members — get members of a room
router.get("/:id/members", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      "members.user",
      "username"
    );
    if (!room) return res.status(404).json({ error: "Room not found" });

    const members = room.members.map((m) => ({
      _id: m.user._id,
      username: m.user.username,
      joinedAt: m.joinedAt,
    }));

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rooms/:id/messages — get message history
router.get("/:id/messages", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .select("room user username content createdAt")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
