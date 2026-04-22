export default function handler(req, res) {
  res.status(200).json({
    mapsKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAmTzHBhtQ4E8BG6DL0xdrEOYdZmQEBXkI",
    whatsappNumber: process.env.WHATSAPP_NUMBER || "5492613871088",
    brandColor: "#fbbf24"
  });
}