// backend/src/routes/availability.ts
import { Router } from "express";

const router = Router();

// Mock availability — in production, query DB for online drivers
router.get("/", (_req, res) => {
  const driversOnline = Math.floor(Math.random() * 5) + 1;
  res.json({
    available: driversOnline > 0,
    driversOnline,
    estimatedWait: driversOnline > 0 ? Math.ceil(5 / driversOnline) : 30,
  });
});

export default router;
