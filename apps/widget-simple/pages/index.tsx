// apps/widget-simple/pages/index.tsx
import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492612345678";

type Availability = { available: boolean; driversOnline: number; estimatedWait: number };

export default function WidgetSimple() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);

  // Simple polling for availability (no WebSocket needed for Simple tier)
  useEffect(() => {
    let active = true;
    async function fetchAvailability() {
      try {
        const r = await fetch(`${BACKEND_URL}/api/availability`);
        const data = await r.json();
        if (active) setAvailability(data);
      } catch (_) {}
    }
    fetchAvailability();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchAvailability();
    }, 15000);

    document.addEventListener("visibilitychange", fetchAvailability);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", fetchAvailability);
    };
  }, []);

  function handleRequest() {
    if (!origin.trim() || !destination.trim()) return;
    const msg = encodeURIComponent(
      `🚖 Solicitud de taxi\n📍 Origen: ${origin}\n🏁 Destino: ${destination}\n\nPor favor confirmen disponibilidad.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Widget card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">

        {/* Header stripe */}
        <div className="bg-brand px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚖</span>
            <div>
              <p className="font-bold text-black text-sm leading-tight">Pedí tu taxi</p>
              <p className="text-black/60 text-xs">Servicio rápido y confiable</p>
            </div>
          </div>
          {/* Availability pill */}
          {availability && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              availability.available
                ? "bg-black/10 text-black"
                : "bg-red-100 text-red-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${availability.available ? "bg-green-600 animate-pulse" : "bg-red-500"}`} />
              {availability.available
                ? `${availability.driversOnline} disponibles`
                : "Sin servicio"}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Punto de recogida
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">📍</span>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej: Av. San Martín 1234"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Destino
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">🏁</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Terminal de ómnibus"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {availability && availability.estimatedWait > 0 && (
            <p className="text-xs text-slate-400 text-center">
              ⏱ Tiempo estimado de espera: <span className="font-semibold text-slate-600">{availability.estimatedWait} min</span>
            </p>
          )}

          <button
            onClick={handleRequest}
            disabled={!origin.trim() || !destination.trim() || submitted}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              submitted
                ? "bg-green-500 text-white"
                : !origin.trim() || !destination.trim()
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-brand hover:bg-brand-dark text-black shadow-md shadow-brand/30 hover:shadow-lg hover:shadow-brand/40 active:scale-95"
            }`}
          >
            {submitted ? (
              <>✅ WhatsApp abierto</>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar por WhatsApp
              </>
            )}
          </button>
        </div>

        <div className="px-5 pb-4 text-center">
          <p className="text-xs text-slate-300">Redirige a WhatsApp con tu solicitud pre-cargada</p>
        </div>
      </div>
    </div>
  );
}
