// backend/src/index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import ordersRouter from "./routes/orders";
import driversRouter from "./routes/drivers";
import availabilityRouter from "./routes/availability";
import webhookRouter from "./routes/webhook";
import { setupSocketHandlers } from "./sockets/handlers";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/orders", ordersRouter(io));
app.use("/api/drivers", driversRouter(io));
app.use("/api/availability", availabilityRouter);
app.use("/api/webhook", webhookRouter(io));

// Socket.io handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚖 TaxiApp Backend running on http://localhost:${PORT}`);
});

export { io };
