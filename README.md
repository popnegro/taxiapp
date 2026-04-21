# 🚖 TaxiApp — Monorepo PMV

Sistema de pedidos de taxi vía WhatsApp con widgets embebibles y dashboard de gestión en tiempo real.

---

## 📁 Estructura del proyecto

```
taxiapp/
├── apps/
│   ├── dashboard/        → Panel de gestión operacional (Next.js · puerto 3000)
│   ├── widget-simple/    → Widget básico con redirección a WhatsApp (puerto 3001)
│   ├── widget-medium/    → Widget intermedio con pedido directo vía API (puerto 3002)
│   └── widget-pro/       → Widget premium con tracking WebSocket en tiempo real (puerto 3003)
├── backend/              → API REST + WebSocket server (Node.js · puerto 4000)
│   ├── src/
│   │   ├── index.ts          → Entry point (Express + Socket.io)
│   │   ├── routes/
│   │   │   ├── orders.ts     → CRUD de pedidos + emisión de eventos
│   │   │   ├── drivers.ts    → Gestión de conductores
│   │   │   ├── availability.ts → Disponibilidad en tiempo real
│   │   │   └── webhook.ts    → Webhook de WhatsApp Business API
│   │   └── sockets/
│   │       └── handlers.ts   → Manejo de canales WebSocket
│   └── prisma/
│       └── schema.prisma     → Schema PostgreSQL (producción)
└── packages/
    └── types/            → Tipos TypeScript compartidos entre apps
```

---

## 🚀 Inicio rápido

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/taxiapp.git
cd taxiapp
npm install
```

### 2. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env

# Cada app (repetir para widget-medium, widget-pro, dashboard)
cp apps/widget-simple/.env.example apps/widget-simple/.env.local
```

### 3. Levantar todos los servicios en paralelo

```bash
# Opción A: con Turbo (recomendado)
npm run dev

# Opción B: servicios individuales
npm run dev:backend      # Puerto 4000
npm run dev:dashboard    # Puerto 3000
npm run dev:widget-simple  # Puerto 3001
npm run dev:widget-medium  # Puerto 3002
npm run dev:widget-pro     # Puerto 3003
```

---

## 🧩 Widgets

### Widget Simple — `localhost:3001`
- Formulario mínimo: origen + destino
- Disponibilidad consultada por polling cada 15 segundos
- Botón redirige a WhatsApp con mensaje pre-completado (`wa.me`)
- **Sin backend propio** — ideal para validar la demanda

### Widget Medium — `localhost:3002`
- Selector de tipo de vehículo (4 opciones)
- Estimación de precio calculada en frontend
- Formulario con datos del cliente
- Pedido enviado directamente al backend vía REST
- Polling de disponibilidad cada 15 segundos (Page Visibility API)
- Confirmación con número de pedido

### Widget Pro — `localhost:3003`
- Formulario completo: ruta, vehículo, datos, horario programado, notas
- **WebSocket** para tracking en tiempo real del estado del pedido
- Barra de progreso animada: Pendiente → Asignado → En camino → Completado
- Card del conductor con nombre, vehículo y botón de llamada
- Sistema de calificación al completar el viaje

---

## 📊 Dashboard — `localhost:3000`

- Tabla de pedidos en tiempo real (WebSocket)
- Filtros por estado: todos / pendiente / asignado / en camino / completado
- Panel de asignación de conductores disponibles
- Sidebar con estado de cada conductor
- Notificación sonora al recibir nuevos pedidos
- Cambio de estado desde el panel de detalle

---

## 🔧 Backend — `localhost:4000`

### Endpoints REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/orders` | Listar todos los pedidos |
| POST | `/api/orders` | Crear pedido |
| PATCH | `/api/orders/:id` | Actualizar estado/conductor |
| DELETE | `/api/orders/:id` | Cancelar pedido |
| GET | `/api/drivers` | Listar conductores |
| GET | `/api/drivers/available` | Solo conductores disponibles |
| PATCH | `/api/drivers/:id/location` | Actualizar posición GPS |
| PATCH | `/api/drivers/:id/availability` | Cambiar disponibilidad |
| GET | `/api/availability` | Disponibilidad general |
| GET | `/api/webhook/whatsapp` | Verificación de webhook (Meta) |
| POST | `/api/webhook/whatsapp` | Recepción de mensajes |

### Eventos WebSocket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `join:operations` | cliente → server | Dashboard se suscribe a todos los pedidos |
| `join:order` | cliente → server | Widget Pro se suscribe a un pedido específico |
| `order:new` | server → cliente | Nuevo pedido recibido |
| `order:updated` | server → cliente | Estado del pedido actualizado |
| `driver:location` | server → cliente | Posición GPS del conductor |
| `availability:updated` | server → cliente | Cambio en disponibilidad |

---

## 🌐 Variables de entorno

### `backend/.env`
```env
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003

# WhatsApp Business Cloud API (Meta)
WHATSAPP_ACCESS_TOKEN=tu_token_aqui
WHATSAPP_PHONE_ID=tu_phone_id_aqui
WHATSAPP_VERIFY_TOKEN=tu_verify_token_personalizado

# PostgreSQL (producción)
DATABASE_URL=postgresql://user:password@localhost:5432/taxiapp
```

### `apps/*/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_WHATSAPP_NUMBER=5492612345678  # Solo widget-simple
```

---

## 🗄️ Base de datos (producción)

El MVP usa almacenamiento **en memoria** para un arranque inmediato sin dependencias.
Para escalar a producción con PostgreSQL:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

Luego reemplazá el array en memoria en `routes/orders.ts` y `routes/drivers.ts`
por llamadas a `prisma.order` y `prisma.driver`.

---

## ☁️ Despliegue en Vercel

### Frontend (apps)
Cada app se despliega de forma independiente desde Vercel:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar dashboard
cd apps/dashboard && vercel --prod

# Desplegar widget-simple
cd apps/widget-simple && vercel --prod

# etc.
```

### Backend (WebSocket server)
Vercel Serverless no soporta conexiones persistentes WebSocket.
Opciones recomendadas para el backend:

| Plataforma | Plan gratuito | Notas |
|------------|--------------|-------|
| **Railway** | ✅ 5$/mes crédito | Recomendado para producción |
| **Render** | ✅ 750h/mes | Sleep after inactivity en plan free |
| **Fly.io** | ✅ 3 VMs gratuitas | Mejor latencia |

```bash
# Railway (recomendado)
npm install -g @railway/cli
railway login
cd backend && railway up
```

---

## 📱 Configurar WhatsApp Business API

1. Crear app en [Meta for Developers](https://developers.facebook.com)
2. Activar producto **WhatsApp Business Platform**
3. Obtener `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_ID`
4. Configurar webhook apuntando a `https://tu-backend.railway.app/api/webhook/whatsapp`
5. Usar tu `WHATSAPP_VERIFY_TOKEN` personalizado para la verificación

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + React 18 |
| Estilos | Tailwind CSS 3 |
| Tiempo real | Socket.io (WebSocket) |
| Backend | Node.js + Express |
| Tipos | TypeScript |
| ORM (producción) | Prisma + PostgreSQL |
| Monorepo | Turborepo |
| Despliegue frontend | Vercel |
| Despliegue backend | Railway / Render |
| Mensajería | WhatsApp Business Cloud API |

---

## 📄 Licencia

MIT — libre para uso comercial y modificación.
