// backend/src/routes/webhook.ts
import { Router } from "express";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import type { TaxiOrder } from "@taxiapp/types";

export default function webhookRouter(io: Server) {
  const router = Router();

  // WhatsApp webhook verification (Meta requires GET for token challenge)
  router.get("/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("✅ WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // WhatsApp webhook — incoming messages
  router.post("/whatsapp", (req, res) => {
    try {
      const body = req.body;

      if (body.object !== "whatsapp_business_account") {
        return res.sendStatus(404);
      }

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (!message) return res.sendStatus(200);

      const from = message.from; // user phone
      const text = message.text?.body || "";

      console.log(`📱 WhatsApp message from ${from}: ${text}`);

      // Simple parser — in production use NLP or a proper bot flow
      if (text.toLowerCase().includes("taxi") || text.toLowerCase().includes("remis")) {
        const order: TaxiOrder = {
          id: uuidv4(),
          orderNumber: `WA-${Date.now().toString().slice(-6)}`,
          customerName: "Cliente WhatsApp",
          customerPhone: from,
          origin: { address: "Pendiente — vía WhatsApp" },
          destination: { address: "Pendiente — vía WhatsApp" },
          vehicleType: "standard",
          status: "pending",
          estimatedPrice: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Emit to dashboard in real time
        io.to("operations").emit("order:new", order);

        // Optionally: send reply via WhatsApp Cloud API
        sendWhatsAppReply(from, `✅ Recibimos tu solicitud! Número de pedido: ${order.orderNumber}. Un operador te confirmará en breve.`);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("Webhook error:", err);
      res.sendStatus(500);
    }
  });

  return router;
}

async function sendWhatsAppReply(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) return;

  try {
    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error("Error sending WhatsApp reply:", err);
  }
}
