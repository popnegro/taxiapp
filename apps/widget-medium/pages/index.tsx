// apps/widget-medium/pages/index.tsx
import { useState, useEffect, useCallback } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type VehicleType = "standard" | "family" | "accessible" | "premium";
type Step = "form" | "confirm" | "success";
type Availability = { available: boolean; driversOnline: number; estimatedWait: number };

const VEHICLES: { type: VehicleType; label: string; emoji: string; desc: string; priceMultiplier: number }[] = [
  { type: "standard",   label: "Estándar",   emoji: "🚗", desc: "Hasta 4 pasajeros",    priceMultiplier: 1.0 },
  { type: "family",     label: "Familiar",   emoji: "🚐", desc: "Hasta 7 pasajeros",    priceMultiplier: 1.4 },
  { type: "accessible", label: "Accesible",  emoji: "♿", desc: "Adaptado para silla",  priceMultiplier: 1.2 },
  { type: "premium",    label: "Premium",    emoji: "🚙", desc: "Confort superior",      priceMultiplier: 1.8 },
];

const BASE_PRICE = 800; // ARS base for MVP

export default function WidgetMedium() {
  const [step, setStep] = useState<Step>("form");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("standard");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const estimatedPrice = Math.round(
    BASE_PRICE * (VEHICLES.find((v) => v.type === vehicle)?.priceMultiplier ?? 1)
  );

  const fetchAvailability = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/availability`);
      const data = await r.json();
      setAvailability(data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchAvailability();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetchAvailability();
    }, 15000);
    document.addEventListener("visibilitychange", fetchAvailability);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", fetchAvailability);
    };
  }, [fetchAvailability]);

  async function handleSubmit() {
    if (!origin || !destination || !name || !phone) {
      setError("Por favor completá todos los campos.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          origin: { address: origin },
          destination: { address: destination },
          vehicleType: vehicle,
        }),
      });
      const data = await res.json();
      setOrderNumber(data.orderNumber);
      setStep("success");
    } catch (_) {
      setError("Error al enviar el pedido. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOrigin(""); setDestination(""); setName(""); setPhone("");
    setVehicle("standard"); setOrderNumber(null); setStep("form"); setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Availability banner */}
        {availability && (
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-4 text-sm font-medium ${
            availability.available
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${availability.available ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {availability.available
                ? `${availability.driversOnline} conductores disponibles`
                : "Sin conductores disponibles en este momento"}
            </div>
            {availability.available && (
              <span className="text-xs text-emerald-400/70">~{availability.estimatedWait} min</span>
            )}
          </div>
        )}

        {/* Main card */}
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-taxi-400 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-taxi-400/30">🚖</div>
              <div>
                <h1 className="text-white font-semibold text-lg leading-tight">Solicitar Taxi</h1>
                <p className="text-slate-400 text-xs">Confirmación inmediata · Pago en destino</p>
              </div>
            </div>
          </div>

          {step === "form" && (
            <div className="p-6 space-y-5">
              {/* Route inputs */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-red-400 ml-3.5 mt-4 mb-4 rounded-full" />
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/50" />
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Origen"
                        className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-taxi-400/60 focus:bg-slate-700 transition-all"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400 shadow shadow-red-400/50" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Destino"
                        className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-taxi-400/60 focus:bg-slate-700 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle selector */}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Tipo de vehículo</p>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLES.map((v) => (
                    <button
                      key={v.type}
                      onClick={() => setVehicle(v.type)}
                      className={`vehicle-card p-3 rounded-xl border text-left transition-all ${
                        vehicle === v.type
                          ? "border-taxi-400 bg-taxi-400/10 selected"
                          : "border-slate-600/50 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <span className="text-xl mb-1 block">{v.emoji}</span>
                      <p className={`text-xs font-semibold ${vehicle === v.type ? "text-taxi-400" : "text-white"}`}>{v.label}</p>
                      <p className="text-xs text-slate-500">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price estimate */}
              <div className="flex items-center justify-between bg-taxi-400/10 border border-taxi-400/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-slate-400">Precio estimado</p>
                  <p className="text-taxi-400 font-bold text-xl">${estimatedPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Vehículo</p>
                  <p className="text-white text-sm font-medium">
                    {VEHICLES.find((v) => v.type === vehicle)?.emoji} {VEHICLES.find((v) => v.type === vehicle)?.label}
                  </p>
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tus datos</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-taxi-400/60 transition-all"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono (ej: 261 555-0100)"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-taxi-400/60 transition-all"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !availability?.available}
                className="w-full py-4 bg-taxi-400 hover:bg-taxi-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-black disabled:text-slate-400 font-bold rounded-xl transition-all shadow-lg shadow-taxi-400/20 hover:shadow-taxi-400/30 active:scale-95 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Enviando...
                  </span>
                ) : !availability?.available ? (
                  "Sin servicio disponible"
                ) : (
                  "Confirmar pedido →"
                )}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto border border-emerald-400/30">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg mb-1">¡Pedido recibido!</h2>
                <p className="text-slate-400 text-sm">Un conductor fue asignado y llegará pronto.</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                <p className="text-xs text-slate-400 mb-1">Número de pedido</p>
                <p className="text-taxi-400 font-mono font-bold text-2xl">{orderNumber}</p>
              </div>
              <p className="text-xs text-slate-500">Recibirás actualizaciones por WhatsApp al número {phone}</p>
              <button
                onClick={reset}
                className="w-full py-3 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 rounded-xl text-sm transition-all"
              >
                Nuevo pedido
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">Powered by TaxiApp · Mendoza</p>
      </div>
    </div>
  );
}
