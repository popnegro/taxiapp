// apps/widget-pro/pages/index.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type VehicleType = "standard" | "family" | "accessible" | "premium";
type OrderStatus = "pending" | "assigned" | "on_the_way" | "completed" | "cancelled";
type Step = "form" | "tracking";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  driver?: { name: string; vehicle: string; plate: string; phone: string; rating: number };
  estimatedMinutes?: number;
  estimatedPrice?: number;
  vehicleType: VehicleType;
  origin: { address: string };
  destination: { address: string };
}

const VEHICLES = [
  { type: "standard" as VehicleType,   emoji: "🚗", label: "Estándar",  desc: "4 pasaj.",   price: 800 },
  { type: "family"   as VehicleType,   emoji: "🚐", label: "Familiar",  desc: "7 pasaj.",   price: 1100 },
  { type: "accessible" as VehicleType, emoji: "♿", label: "Accesible", desc: "Adaptado",   price: 950 },
  { type: "premium"  as VehicleType,   emoji: "🚙", label: "Premium",   desc: "Confort +",  price: 1500 },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; emoji: string; color: string; step: number }> = {
  pending:    { label: "Buscando conductor",  emoji: "🔍", color: "text-yellow-400",  step: 0 },
  assigned:   { label: "Conductor asignado",  emoji: "👤", color: "text-blue-400",    step: 1 },
  on_the_way: { label: "En camino hacia vos", emoji: "🚖", color: "text-orange-400",  step: 2 },
  completed:  { label: "Viaje completado",    emoji: "✅", color: "text-green-400",   step: 3 },
  cancelled:  { label: "Pedido cancelado",    emoji: "❌", color: "text-red-400",     step: -1 },
};

const STEPS = ["Pendiente", "Asignado", "En camino", "Completado"];

export default function WidgetPro() {
  const [step, setStep]           = useState<Step>("form");
  const [origin, setOrigin]       = useState("");
  const [destination, setDest]    = useState("");
  const [vehicle, setVehicle]     = useState<VehicleType>("standard");
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [scheduled, setScheduled] = useState("");
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [order, setOrder]         = useState<Order | null>(null);
  const [rating, setRating]       = useState(0);
  const [ratingDone, setRatingDone] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Connect WebSocket and subscribe to order
  const subscribeToOrder = useCallback((orderId: string) => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:order", orderId);
    });

    socket.on("order:updated", (updated: Order) => {
      if (updated.id === orderId) {
        setOrder(updated);
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  async function handleSubmit() {
    if (!origin || !destination || !name || !phone) {
      setError("Completá todos los campos requeridos.");
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
          scheduledAt: scheduled || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data: Order = await res.json();
      setOrder(data);
      subscribeToOrder(data.id);
      setStep("tracking");
    } catch (_) {
      setError("Error al enviar el pedido. Verificá tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRating(stars: number) {
    if (!order) return;
    setRating(stars);
    await fetch(`${BACKEND_URL}/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: stars }),
    });
    setRatingDone(true);
  }

  const selectedVehicle = VEHICLES.find((v) => v.type === vehicle)!;
  const statusInfo = order ? STATUS_CONFIG[order.status] : null;
  const currentStep = statusInfo?.step ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* === FORM VIEW === */}
        {step === "form" && (
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">

            {/* Top brand bar */}
            <div className="relative px-6 pt-6 pb-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gold-400 rounded-2xl flex items-center justify-center text-2xl gold-glow">🚖</div>
                  <div>
                    <h1 className="font-bold text-white text-lg">TaxiApp Pro</h1>
                    <p className="text-white/40 text-xs">Servicio premium · Mendoza</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gold-400 font-bold text-xl">${selectedVehicle.price.toLocaleString()}</p>
                  <p className="text-white/30 text-xs">estimado</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-5">

              {/* Route */}
              <div className="relative bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-400 to-red-400 opacity-50" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 flex-shrink-0" />
                    <input
                      type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Desde dónde salís"
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none border-b border-white/10 pb-1 focus:border-gold-400/50 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-400/50 flex-shrink-0" />
                    <input
                      type="text" value={destination} onChange={(e) => setDest(e.target.value)}
                      placeholder="A dónde vas"
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none border-b border-white/10 pb-1 focus:border-gold-400/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle grid */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Vehículo</p>
                <div className="grid grid-cols-4 gap-2">
                  {VEHICLES.map((v) => (
                    <button key={v.type} onClick={() => setVehicle(v.type)}
                      className={`flex flex-col items-center py-3 px-1 rounded-2xl border transition-all ${
                        vehicle === v.type
                          ? "border-gold-400 bg-gold-400/10 shadow-lg shadow-gold-400/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}>
                      <span className="text-xl mb-1">{v.emoji}</span>
                      <span className={`text-xs font-semibold ${vehicle === v.type ? "text-gold-400" : "text-white/60"}`}>{v.label}</span>
                      <span className="text-xs text-white/30">{v.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre *"
                  className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/40 transition-colors"
                />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono *"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/40 transition-colors"
                />
                <input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm focus:outline-none focus:border-gold-400/40 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Notes */}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)"
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/40 resize-none transition-colors"
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
                  {error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-4 bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-black font-bold rounded-2xl transition-all shadow-xl shadow-gold-400/20 hover:shadow-gold-400/30 active:scale-[0.98] text-sm tracking-wide">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black animate-dot-bounce dot-1" />
                    <span className="w-2 h-2 rounded-full bg-black animate-dot-bounce dot-2" />
                    <span className="w-2 h-2 rounded-full bg-black animate-dot-bounce dot-3" />
                  </span>
                ) : "Solicitar ahora →"}
              </button>
            </div>
          </div>
        )}

        {/* === TRACKING VIEW === */}
        {step === "tracking" && order && statusInfo && (
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up">

            {/* Status header */}
            <div className={`px-6 py-5 border-b border-white/10 ${order.status === "cancelled" ? "bg-red-500/10" : "bg-white/5"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl animate-status-pulse">{statusInfo.emoji}</span>
                <span className="font-mono text-xs text-white/30">{order.orderNumber}</span>
              </div>
              <h2 className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.label}</h2>
              {order.estimatedMinutes && order.status !== "completed" && order.status !== "cancelled" && (
                <p className="text-white/40 text-sm mt-0.5">Tiempo estimado: {order.estimatedMinutes} min</p>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Progress steps */}
              {order.status !== "cancelled" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {STEPS.map((label, i) => (
                      <div key={label} className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          i < currentStep ? "bg-green-400 border-green-400 text-black"
                          : i === currentStep ? "border-gold-400 text-gold-400 bg-gold-400/10"
                          : "border-white/10 text-white/20"
                        }`}>
                          {i < currentStep ? "✓" : i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`hidden`} /> // spacer handled by flex
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Connector bar */}
                  <div className="relative h-0.5 bg-white/10 rounded-full mx-3.5 -mt-5 mb-5">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-gold-400 rounded-full transition-all duration-700"
                      style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between px-1 -mt-3">
                    {STEPS.map((label, i) => (
                      <span key={label} className={`text-[10px] transition-colors ${
                        i === currentStep ? "text-gold-400 font-semibold" : i < currentStep ? "text-green-400" : "text-white/20"
                      }`}>{label}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver card */}
              {order.driver && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {order.driver.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{order.driver.name}</p>
                    <p className="text-white/40 text-xs">{order.driver.vehicle} · {order.driver.plate}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s} className={`text-xs ${s <= Math.round(order.driver!.rating) ? "text-gold-400" : "text-white/20"}`}>★</span>
                      ))}
                      <span className="text-xs text-white/30 ml-1">{order.driver.rating}</span>
                    </div>
                  </div>
                  <a href={`tel:${order.driver.phone}`}
                    className="w-10 h-10 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors">
                    📞
                  </a>
                </div>
              )}

              {/* Pending state — searching animation */}
              {order.status === "pending" && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-dot-bounce dot-1" />
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-dot-bounce dot-2" />
                    <span className="w-2 h-2 bg-gold-400 rounded-full animate-dot-bounce dot-3" />
                  </div>
                  <p className="text-white/40 text-sm">Conectando con el conductor más cercano...</p>
                  <p className="text-white/20 text-xs mt-1">Esto toma menos de 2 minutos</p>
                </div>
              )}

              {/* Route summary */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex gap-3 items-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                  <p className="text-white/60 text-xs">{order.origin.address}</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  <p className="text-white/60 text-xs">{order.destination.address}</p>
                </div>
                {order.estimatedPrice && (
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-white/30">Precio estimado</span>
                    <span className="text-gold-400 font-bold font-mono">${order.estimatedPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Rating — only after completion */}
              {order.status === "completed" && !ratingDone && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-white/60 text-sm mb-3">¿Cómo fue tu experiencia?</p>
                  <div className="flex justify-center gap-2">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => submitRating(s)}
                        className={`text-2xl transition-all hover:scale-110 ${rating >= s ? "text-gold-400" : "text-white/20"}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ratingDone && (
                <div className="text-center py-2">
                  <p className="text-green-400 text-sm font-medium">¡Gracias por tu calificación! ⭐</p>
                </div>
              )}

              {/* New order */}
              {(order.status === "completed" || order.status === "cancelled") && (
                <button
                  onClick={() => { setStep("form"); setOrder(null); setRating(0); setRatingDone(false); socketRef.current?.disconnect(); }}
                  className="w-full py-3 border border-white/10 text-white/50 hover:text-white hover:border-white/20 rounded-2xl text-sm transition-all">
                  Nuevo pedido
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-white/15 text-xs mt-4">TaxiApp Pro · Sincronización en tiempo real via WebSocket</p>
      </div>
    </div>
  );
}
