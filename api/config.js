export default function handler(req, res) {
  res.status(200).json({
    mapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
    whatsappNumber: process.env.WHATSAPP_NUMBER || "5492613871088",
    brandColor: "#fbbf24"
  });
}