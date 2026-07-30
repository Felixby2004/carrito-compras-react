<div align="center">

# 🛒 NexTouch LLC — Enterprise E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Plataforma Web Fullstack de comercio electrónico desarrollada para **NexTouch LLC**. Incluye experiencia de compra omnicanal para clientes con cálculo dinámico de Ubigeo Perú, gestión de carrito y checkout, emisión de comprobantes en PDF con branding oficial y un panel administrativo avanzado con KPIs comerciales, inventarios y analítica.

[Explorar API Swagger](http://localhost:3001/api/docs) · [Reportar un error](https://github.com/Felixby2004/carrito-compras-react/issues)

</div>

---

## 📋 Tabla de Contenidos

- [🏛️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [✨ Funcionalidades Clave](#-funcionalidades-clave)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [⚡ Inicio Rápido con Docker](#-inicio-rápido-con-docker-recomendado)
- [💻 Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
- [👤 Credenciales de Acceso y Roles](#-credenciales-de-acceso-y-roles)
- [📡 Especificación de la API (Endpoints)](#-especificación-de-la-api-endpoints)
- [📄 Generación de Comprobantes PDF](#-generación-de-comprobantes-pdf)
- [☁️ Despliegue en Producción](#️-despliegue-en-producción)
- [🔧 Solución de Problemas y Diagnóstico](#-solución-de-problemas-y-diagnóstico)
- [📄 Licencia y Contacto](#-licencia-y-contacto)

---

## 🏛️ Arquitectura del Sistema

```
                         ┌────────────────────────────────────────┐
                         │       Navegador Web / Cliente          │
                         │   (React + Vite + Tailwind CSS)        │
                         └──────────────────┬─────────────────────┘
                                            │ HTTP / REST / WebSocket
                                            ▼
                         ┌────────────────────────────────────────┐
                         │       Servidor Backend (API)           │
                         │   (Node.js + Express + TypeScript)     │
                         └───────┬────────────────────────┬───────┘
                                 │                        │
             ┌───────────────────┴────────┐      ┌────────┴────────────────────┐
             │ Base de Datos PostgreSQL   │      │ Documentos PDF & Media      │
             │ (Prisma ORM - 15+ Tablas)  │      │ (PDFKit + Public Static)    │
             └────────────────────────────┘      └─────────────────────────────┘
```

---

## ✨ Funcionalidades Clave

### 🛍️ Portal del Cliente (eShop)
* **Catálogo Dinámico:** Filtrado avanzado por categorías, marcas, rangos de precio y búsqueda en tiempo real.
* **Carrito y Cupones:** Sincronización local y persistente con aplicación de cupones promocionales con descuento.
* **Checkout Inteligente (Ubigeo Perú):** Formulario dinámico con departamentos, provincias y distritos cargados para los 25 departamentos de Perú.
* **Gestión de Órdenes:** Historial de compras (`/mis-ordenes`), seguimiento de estado (*tracking*), cancelación en ventana de tiempo y descarga de comprobantes en PDF.
* **Lista de Deseos y Reseñas:** Guardado de productos favoritos y valoraciones con estrellas.

### 🛡️ Panel de Administración (Backoffice)
* **Dashboard Analítico:** Indicadores KPI en tiempo real (ventas totales, órdenes pagadas, ticket promedio, ventas diarias).
* **Gestión de Catálogo:** Creación, edición y control de productos, subcategorías e imágenes.
* **Control de Inventario:** Monitor de stock con alertas de productos en nivel crítico y registro de movimientos.
* **Gestión de Pedidos:** Cambio de estado de órdenes, asignación de números de seguimiento e impresión de facturas/guías.
* **Configuración Comercial:** Personalización de temas visuales, impuestos e identidad corporativa de NexTouch LLC.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript | SPA de alto rendimiento con renderizado modular. |
| **Styling** | TailwindCSS, Lucide Icons | Sistema de diseño moderno, responsivo y adaptativo. |
| **Estado Global** | Zustand | Gestión ligera y persistente de estado (auth, cart, wishlist). |
| **Backend** | Node.js, Express, TypeScript | API RESTful escalable con arquitectura por capas. |
| **ORM & DB** | Prisma ORM, PostgreSQL 15 | Modelado de datos relacional con migraciones tipo-seguras. |
| **Autenticación** | JWT (JSON Web Tokens), Bcrypt | Esquema de seguridad con Access Token (15m) + Refresh Token (7d). |
| **Documentación**| Swagger UI (`swagger-jsdoc`) | Especificación interactiva OpenAPI 3.0. |
| **Contenedores** | Docker, Docker Compose | Infraestructura reproducible para desarrollo y producción. |

---

## ⚡ Inicio Rápido con Docker (Recomendado)

Con un solo comando puedes desplegar toda la infraestructura en contenedores (Base de datos + Backend + Frontend):

```bash
docker compose up --build -d
```

### Puertos y Accesos del Entorno:

| Servicio | URL / Host | Descripción |
| :--- | :--- | :--- |
| 🌐 **Frontend Web App** | `http://localhost:5173` | Aplicación React principal |
| ⚙️ **Backend API** | `http://localhost:3001/api/v1` | API REST de Node.js / Express |
| 📚 **Documentación Swagger** | `http://localhost:3001/api/docs` | Swagger UI interactivo |
| 🗄️ **Base de Datos PostgreSQL** | `localhost:5433` | Host DB (`ecommerce_db`, user: `postgres`, pass: `123456`) |

Para detener y limpiar la infraestructura de contenedores:
```bash
docker compose down
```

---

## 💻 Instalación y Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Felixby2004/carrito-compras-react.git
cd carrito-compras-react
```

### 2. Configurar la base de datos PostgreSQL

```sql
CREATE USER postgres WITH PASSWORD '123456';
CREATE DATABASE ecommerce_db OWNER postgres;
```

### 3. Instalar dependencias

```bash
# Dependencias Backend
cd backend
npm install

# Dependencias Frontend
cd ../frontend
npm install
```

### 4. Inicializar Prisma y sembrar datos iniciales

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Ejecutar en modo desarrollo

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

---

## 👤 Credenciales de Acceso y Roles

> ℹ️ Las siguientes cuentas de demostración son generadas automáticamente por la semilla de datos (`seed.ts`):

| Rol de Usuario | Email Oficial (NexTouch LLC) | Contraseña | Email Legacy | Alcance de Permisos |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Administrador Global** | `admin@nextouch.com` | `Admin123!` | `admin@ecommerce.com` | Acceso ilimitado a todas las funciones del sistema y Backoffice. |
| 📈 **Gerente de Ventas** | `ventas@nextouch.com` | `Ventas123!` | `ventas@ecommerce.com` | Gestión de ventas, listado de órdenes y clientes en `/admin`. |
| 📦 **Gerente de Inventario** | `inventario@nextouch.com` | `Inventario123!` | `inventario@ecommerce.com` | Control de stock, alertas de reposición y proveedores. |
| 💼 **Vendedor** | `vendedor@nextouch.com` | `Vendedor123!` | `vendedor@ecommerce.com` | Consulta de productos, precios y creación de órdenes. |
| 🛒 **Cliente Demo** | `cliente1@nextouch.com` | `Cliente123!` | `cliente1@ecommerce.com` | Navegación, compra, seguimiento de pedidos y comprobantes PDF. |

---

## 📡 Especificación de la API (Endpoints)

La API sigue las convenciones RESTful. Documentación Swagger disponible en `/api/docs`.

### Endpoints Principales:

```
GET    /health                                   --> Verifica el estado de la API
POST   /api/v1/auth/login                        --> Autenticación de usuario
POST   /api/v1/auth/register                     --> Registro de nuevos usuarios
POST   /api/v1/auth/refresh-token                --> Renovación de tokens JWT

GET    /api/v1/productos                         --> Obtiene catálogo paginado con filtros
GET    /api/v1/productos/categorias/con-productos--> Categorías que contienen productos activos
GET    /api/v1/productos/:id                     --> Detalle de un producto específico

POST   /api/v1/ordenes                           --> Creación de pedido (cliente/invitado)
GET    /api/v1/ordenes/mis-ordenes               --> Historial de pedidos del cliente autenticado
GET    /api/v1/ordenes/mis-ordenes/:id           --> Detalle de pedido del cliente
GET    /api/v1/ordenes/mis-ordenes/:id/factura   --> Descarga de comprobante en PDF
PUT    /api/v1/ordenes/mis-ordenes/:id/cancelar  --> Cancelación de orden por el cliente

GET    /api/v1/ordenes/admin                     --> Listado general de órdenes (Admin)
GET    /api/v1/ordenes/admin/estadisticas        --> Indicadores KPI para el Dashboard
```

---

## 📄 Generación de Comprobantes PDF

El sistema cuenta con un motor embebido basado en **PDFKit** para emitir comprobantes de pago oficiales en formato PDF:

* **Branding Institucional:** Incorpora automáticamente el isotipo en PNG con fondo transparente de **NexTouch LLC**.
* **Estructura Estándar:** Datos de emisión, desglose de ítems, subtotal, IGV (18%), costo de envío y monto total pagado.
* **Descarga Directa:** Generación al vuelo a través de las rutas `/mis-ordenes/:id/factura` y `/admin/:id/documentos/factura`.

---

## ☁️ Despliegue en Producción

### Frontend (Vercel)
1. Conecta el repositorio en Vercel.
2. Define la variable de entorno `VITE_API_URL` apuntando a tu API en producción (ej. `https://nextouch-api.onrender.com/api/v1`).
3. Build Command: `npm run build` | Output Directory: `dist`.

### Backend (Render / Railway)
1. Crea un Web Service en Render con entorno Node.js.
2. Configura las variables de entorno principales:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
   JWT_SECRET=tu_clave_secreta_de_minimo_32_caracteres_aqui
   JWT_REFRESH_SECRET=tu_clave_refresh_secreta_de_minimo_32_caracteres
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```
3. Build Command: `cd backend && npm install && npx prisma generate && npm run build`
4. Start Command: `cd backend && npm start`

---

## 🔧 Solución de Problemas y Diagnóstico

| Síntoma | Diagnóstico | Solución |
| :--- | :--- | :--- |
| **Error 401 en Refresh Token** | Token expirado o ruta mal invocada. | El cliente axios en `client.ts` maneja el refresco automático y limpia el estado sin colgar la interfaz. |
| **Error 404 al filtrar por estado** | Falta de la constante `ESTADOS_PERMITIDOS` en controlador. | Solucionado en `orden.controller.ts`. Reinicia el backend con `docker compose restart backend`. |
| **Pantalla en blanco al ingresar a Admin** | Verificación sincrónica antes de cargar usuario en memoria. | Resuelto en `AdminRoute.tsx` mediante pantalla de carga con indicador `hasToken`. |
| **Provincias o Distritos vacíos** | Dataset de Ubigeo incompleto. | Resuelto en `frontend/src/data/ubigeo.ts` cargando las provincias y distritos de los 25 departamentos de Perú. |

---

## 📄 Licencia y Contacto

© 2026 **NexTouch LLC**. Todos los derechos reservados.

- **Empresa:** NexTouch LLC
- **Soporte Técnico:** `contacto@nextouch.com`
- **Repositorio:** [github.com/Felixby2004/carrito-compras-react](https://github.com/Felixby2004/carrito-compras-react)
