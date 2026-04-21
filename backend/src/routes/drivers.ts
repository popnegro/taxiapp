// backend/src/routes/drivers.ts
import { Router } from "express";
import { Server } from "socket.io";
import type { Driver } from "@taxiapp/types";

// Mock drivers for MVP
let drivers: Driver[] = [
  {
    id: "d1",
    name: "Carlos Méndez",
    phone: "+54 261 555-0101",
    vehicle: "Toyota Corolla",
    plate: "MZA 123",
    vehicleType: "standard",
    rating: 4.8,
    lat: -32.8908,
    lng: -68.8272,
    available: true,
  },
  {
    id: "d2",
    name: "Ana Rodríguez",
    phone: "+54 261 555-0202",
    vehicle: "Renault Kangoo",
    plate: "MZA 456",
    vehicleType: "family",
    rating: 4.9,
    lat: -32.8985,
    lng: -68.8312,
    available: true,
  },
  {
    id: "d3",
    name: "Luis Pereyra",
    phone: "+54 261 555-0303",
    vehicle: "VW Voyage Adaptado",
    plate: "MZA 789",
    vehicleType: "accessible",
    rating: 4.7,
    lat: -32.8855,
    lng: -68.8190,
    available: false,
  },
  {
    id: "d4",
    name: "María González",
    phone: "+54 261 555-0404",
    vehicle: "Toyota Hilux",
    plate: "MZA 321",
    vehicleType: "premium",
    rating: 5.0,
    lat: -32.8920,
    lng: -68.8350,
    available: true,
  },
];

export default function driversRouter(io: Server) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(drivers);
  });

  router.get("/available", (_req, res) => {
    res.json(drivers.filter((d) => d.available));
  });

  router.patch("/:id/location", (req, res) => {
    const driver = drivers.find((d) => d.id === req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const { lat, lng } = req.body;
    driver.lat = lat;
    driver.lng = lng;

    io.to("operations").emit("driver:location", {
      driverId: driver.id,
      lat,
      lng,
    });

    res.json({ ok: true });
  });

  router.patch("/:id/availability", (req, res) => {
    const driver = drivers.find((d) => d.id === req.params.id);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    driver.available = req.body.available;

    const availableCount = drivers.filter((d) => d.available).length;
    io.emit("availability:updated", {
      available: availableCount > 0,
      driversOnline: availableCount,
      estimatedWait: availableCount > 0 ? Math.ceil(5 / availableCount) : 30,
    });

    res.json(driver);
  });

  return router;
}
