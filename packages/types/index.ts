// packages/types/index.ts

export type OrderStatus =
  | "pending"
  | "assigned"
  | "on_the_way"
  | "completed"
  | "cancelled";

export type VehicleType = "standard" | "family" | "accessible" | "premium";

export interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  vehicleType: VehicleType;
  rating: number;
  lat?: number;
  lng?: number;
  available: boolean;
  avatarUrl?: string;
}

export interface TaxiOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  origin: Location;
  destination: Location;
  vehicleType: VehicleType;
  status: OrderStatus;
  driver?: Driver;
  estimatedPrice?: number;
  estimatedMinutes?: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  rating?: number;
}

export interface AvailabilityResponse {
  available: boolean;
  driversOnline: number;
  estimatedWait: number; // minutes
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  origin: Location;
  destination: Location;
  vehicleType: VehicleType;
  scheduledAt?: string;
  notes?: string;
}

// Socket event types
export interface SocketEvents {
  "order:new": TaxiOrder;
  "order:updated": TaxiOrder;
  "order:assigned": { orderId: string; driver: Driver };
  "driver:location": { driverId: string; lat: number; lng: number };
  "availability:updated": AvailabilityResponse;
}
