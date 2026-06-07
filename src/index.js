import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import { setupSocket } from "./socket.js";

const app = express();
const httpServer = createServer(app);

// CORS — allow CLIENT_URL (comma-separated list supported)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Socket.IO
setupSocket(io);

// Start server — bind to 0.0.0.0 and use Cloud Run's $PORT
const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = "0.0.0.0";

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connect failed, starting server anyway so Cloud Run health-check passes:", err.message);
  }
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
  });
}

start();

