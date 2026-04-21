// backend/src/sockets/handlers.ts
import { Server, Socket } from "socket.io";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Dashboard operators join the "operations" room
    socket.on("join:operations", () => {
      socket.join("operations");
      console.log(`📊 Dashboard joined operations room: ${socket.id}`);
    });

    // Widget Pro: user subscribes to a specific order
    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`👤 User subscribed to order: ${orderId}`);
    });

    // Driver location updates
    socket.on("driver:update-location", ({ driverId, lat, lng }: { driverId: string; lat: number; lng: number }) => {
      io.to("operations").emit("driver:location", { driverId, lat, lng });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
