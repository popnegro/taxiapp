// apps/dashboard/pages/index.tsx
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { TaxiOrder, Driver } from "../../packages/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  on_the_way: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

const VEHICLE_LABELS: Record<string, string> = {
  standard: "Estándar",
  family: "Familiar",
  accessible: "Accesible",
  premium: "Premium",
};

export default function Dashboard() {
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [connected, setConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TaxiOrder | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, completed: 0 });
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch initial data
    fetch(`${BACKEND_URL}/api/orders`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error);

    fetch(`${BACKEND_URL}/api/drivers`)
      .then((r) => r.json())
      .then(setDrivers)
      .catch(console.error);

    // Connect WebSocket
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:operations");
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("order:new", (order: TaxiOrder) => {
      setOrders((prev) => [order, ...prev]);
      setNewOrderIds((prev) => new Set([...prev, order.id]));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
      }, 2000);
      // Play notification sound (browser AudioContext)
      playNotification();
    });

    socket.on("order:updated", (updated: TaxiOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder((prev) => (prev?.id === updated.id ? updated : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const active = orders.filter((o) => ["assigned", "on_the_way"].includes(o.status)).length;
    const completed = orders.filter((o) => o.status === "completed").length;
    setStats({ total, pending, active, completed });
  }, [orders]);

  function playNotification() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }

  async function assignDriver(orderId: string, driverId: string) {
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "assigned", driver }),
    });
  }

  async function updateStatus(orderId: string, status: string) {
    await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-surface text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-yellow rounded-lg flex items-center justify-center">
            <span className="text-xl">🚖</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">TaxiApp Dashboard</h1>
            <p className="text-xs text-slate-500">Panel de Gestión Operacional</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${connected ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "En línea" : "Desconectado"}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {new Date().toLocaleTimeString("es-AR")}
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-b border-surface-border">
        {[
          { label: "Total hoy", value: stats.total, color: "text-slate-300" },
          { label: "Pendientes", value: stats.pending, color: "text-yellow-400" },
          { label: "Activos", value: stats.active, color: "text-blue-400" },
          { label: "Completados", value: stats.completed, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="px-6 py-4 border-r border-surface-border last:border-r-0">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Orders List */}
        <div className="w-[420px] border-r border-surface-border flex flex-col">
          {/* Filter tabs */}
          <div className="flex gap-1 p-3 border-b border-surface-border">
            {["all", "pending", "assigned", "on_the_way", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-accent-yellow text-black"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-raised"
                }`}
              >
                {f === "all" ? "Todos" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Order list */}
          <div className="overflow-y-auto flex-1">
            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-sm">Sin pedidos</p>
              </div>
            )}
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border-b border-surface-border cursor-pointer transition-all hover:bg-surface-raised ${
                  selectedOrder?.id === order.id ? "bg-surface-raised border-l-2 border-l-accent-yellow" : ""
                } ${newOrderIds.has(order.id) ? "new-order-ping" : ""}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-slate-500">{order.orderNumber}</span>
                  <span className={`status-badge status-${order.status}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="font-medium text-sm mb-1">{order.customerName}</p>
                <p className="text-xs text-slate-400 truncate">📍 {order.origin.address}</p>
                <p className="text-xs text-slate-400 truncate">🏁 {order.destination.address}</p>
                {order.driver && (
                  <p className="text-xs text-blue-400 mt-1">👤 {order.driver.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedOrder ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <span className="text-5xl mb-4">🚖</span>
              <p className="text-lg font-medium text-slate-500">Seleccioná un pedido</p>
              <p className="text-sm text-slate-600">para ver los detalles y gestionar la asignación</p>
            </div>
          ) : (
            <div className="max-w-2xl animate-fade-in">
              {/* Order header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-slate-500 text-sm">{selectedOrder.orderNumber}</span>
                    <span className={`status-badge status-${selectedOrder.status}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[selectedOrder.status]}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold">{selectedOrder.customerName}</h2>
                  <p className="text-slate-400 text-sm">{selectedOrder.customerPhone}</p>
                </div>
                {selectedOrder.estimatedPrice && (
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-accent-yellow">
                      ${selectedOrder.estimatedPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">precio estimado</p>
                  </div>
                )}
              </div>

              {/* Route info */}
              <div className="bg-surface-raised border border-surface-border rounded-xl p-4 mb-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Ruta</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">A</span>
                    <div>
                      <p className="text-xs text-slate-500">Origen</p>
                      <p className="text-sm font-medium">{selectedOrder.origin.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">B</span>
                    <div>
                      <p className="text-xs text-slate-500">Destino</p>
                      <p className="text-sm font-medium">{selectedOrder.destination.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle type */}
              <div className="bg-surface-raised border border-surface-border rounded-xl p-4 mb-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Vehículo solicitado</h3>
                <p className="text-sm font-medium">{VEHICLE_LABELS[selectedOrder.vehicleType]}</p>
              </div>

              {/* Assign driver */}
              {selectedOrder.status === "pending" && (
                <div className="bg-surface-raised border border-surface-border rounded-xl p-4 mb-4">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Asignar conductor</h3>
                  <div className="space-y-2">
                    {drivers.filter((d) => d.available).map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => assignDriver(selectedOrder.id, driver.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-surface-border rounded-lg hover:border-accent-yellow/50 hover:bg-accent-yellow/5 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.vehicle} · {driver.plate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-yellow-400">★ {driver.rating}</span>
                          <span className="text-xs text-slate-600 group-hover:text-accent-yellow transition-colors">Asignar →</span>
                        </div>
                      </button>
                    ))}
                    {drivers.filter((d) => d.available).length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-2">Sin conductores disponibles</p>
                    )}
                  </div>
                </div>
              )}

              {/* Current driver */}
              {selectedOrder.driver && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <h3 className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">Conductor asignado</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {selectedOrder.driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedOrder.driver.name}</p>
                      <p className="text-sm text-slate-400">{selectedOrder.driver.vehicle} · {selectedOrder.driver.plate}</p>
                      <p className="text-sm text-slate-400">{selectedOrder.driver.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status actions */}
              <div className="bg-surface-raised border border-surface-border rounded-xl p-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Cambiar estado</h3>
                <div className="flex flex-wrap gap-2">
                  {["pending", "assigned", "on_the_way", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      disabled={selectedOrder.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedOrder.status === s
                          ? "bg-accent-yellow text-black"
                          : "bg-surface border border-surface-border hover:border-slate-500 text-slate-300"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drivers sidebar */}
        <div className="w-64 border-l border-surface-border flex flex-col">
          <div className="px-4 py-3 border-b border-surface-border">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conductores</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={`p-3 rounded-lg border ${
                  driver.available
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-surface-border bg-surface-raised opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{driver.name}</p>
                    <p className="text-xs text-slate-500">{VEHICLE_LABELS[driver.vehicleType]}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${driver.available ? "text-green-400" : "text-slate-500"}`}>
                    {driver.available ? "● Disponible" : "○ Ocupado"}
                  </span>
                  <span className="text-xs text-yellow-400">★ {driver.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
