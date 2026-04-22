export default function handler(req, res) {
  res.status(200).json({
    mapsKey: process.env.GOOGLE_MAPS_API_KEY || "",
    whatsappNumber: process.env.WHATSAPP_NUMBER || "5492613871088",
    brandColor: "#fbbf24",
    googleClientId: process.env.GOOGLE_CLIENT_ID || "TU_ID_CLIENTE_POR_DEFECTO", // Añadir Google Client ID
    mendozaBounds: { north: -32.75, south: -33.10, west: -68.95, east: -68.70 }, // Centralizar límites de Mendoza
    rates: { flag: 1200, km: 650 } // Centralizar tarifas
  });
}