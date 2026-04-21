// backend/src/routes/orders.ts
import { Router } from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import type { TaxiOrder, CreateOrderPayload } from "@taxiapp/types";

// In-memory store for MVP (replace with PostgreSQL/Prisma in production)
let orders: TaxiOrder[] = [];

export default function ordersRouter(io: Server) {
  const router = Router();

  // GET all orders
  router.get("/", (_req, res) => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  });

  // GET single order
  router.get("/:id", (req, res) => {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  });

  // POST create order
  router.post("/", (req, res) => {
    const payload: CreateOrderPayload = req.body;

    const newOrder: TaxiOrder = {
      id: uuidv4(),
      orderNumber: `TX-${Date.now().toString().slice(-6)}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      origin: payload.origin,
      destination: payload.destination,
      vehicleType: payload.vehicleType || "standard",
      status: "pending",
      scheduledAt: payload.scheduledAt,
      notes: payload.notes,
      estimatedPrice: Math.floor(Math.random() * 800 + 300), // Mock price in ARS
      estimatedMinutes: Math.floor(Math.random() * 10 + 3),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    // Emit real-time event to dashboard
    io.to("operations").emit("order:new", newOrder);

    res.status(201).json(newOrder);
  });

  // PATCH update order status / assign driver
  router.patch("/:id", (req, res) => {
    const index = orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Order not found" });

    orders[index] = {
      ...orders[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const updated = orders[index];

    // Emit update to operations room (dashboard) and specific order room
    io.to("operations").emit("order:updated", updated);
    io.to(`order:${updated.id}`).emit("order:updated", updated);

    res.json(updated);
  });

  // DELETE cancel order
  router.delete("/:id", (req, res) => {
    const index = orders.findIndex((o) => o.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Order not found" });

    orders[index] = {
      ...orders[index],
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    io.to("operations").emit("order:updated", orders[index]);
    io.to(`order:${orders[index].id}`).emit("order:updated", orders[index]);

    res.json(orders[index]);
  });

  return router;
}
