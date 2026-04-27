# 🛒 Sistema de E-Commerce con Carrito de Compras

Sistema fullstack de e-commerce con frontend en React/Vite y backend en Node.js + PostgreSQL + Prisma. Permite a los clientes navegar un catálogo, gestionar su carrito, realizar compras y hacer seguimiento de pedidos. Los administradores disponen de un panel completo con KPIs, gestión de productos, inventario, órdenes y reportes PDF.

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos previos](#-requisitos-previos)
- [Instalación local](#-instalación-local)
- [Variables de entorno](#-variables-de-entorno)
- [Credenciales de prueba](#-credenciales-de-prueba)
- [Despliegue en servidor](#-despliegue-en-servidor)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [API Reference](#-api-reference)
- [Solución de problemas](#-solución-de-problemas)

---

## ✨ Características

### Para clientes
- Registro, inicio de sesión y gestión de perfil
- Catálogo con filtros por categoría y rango de precio
- Búsqueda de productos en tiempo real
- Carrito de compras con cupones de descuento
- Checkout multi-paso (dirección → envío → pago → confirmación)
- Seguimiento de órdenes y descarga de comprobantes PDF
- Lista de deseos y sistema de reseñas

### Para administradores
- Dashboard con KPIs: ventas totales, ticket promedio, productos más vendidos
- Gestión completa de productos, categorías e imágenes
- Control de inventario con alertas de stock bajo
- Procesamiento de órdenes y gestión de envíos
- Historial y datos de clientes
- Reportes PDF de ventas, inventario y movimientos
- Estadísticas avanzadas y segmentación de clientes

---

## 🛠 Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT (access + refresh token) |
| Documentación API | Swagger UI |
| Reportes | PDF export |

---

## 📦 Requisitos previos

| Componente | Versión mínima | Recomendada |
|-----------|---------------|-------------|
| Node.js | 18+ | 20 LTS |
| PostgreSQL | 14+ | 16+ |
| npm | 9+ | 10+ |
| Git (opcional) | 2.40+ | Cualquiera |
| Docker (opcional) | 24+ | 26+ |

---

## 🚀 Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Felixby2004/carrito-compras-react.git
cd carrito-compras-react
```

### 2. Configurar la base de datos PostgreSQL

```sql
CREATE USER ecommerce_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE ecommerce_db OWNER ecommerce_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;
```

### 3. Configurar variables de entorno

```bash
# Backend
cd backend
cp .env.example .env   # Linux/Mac
copy .env.example .env # Windows PowerShell
```

Edita `backend/.env` con tus valores (ver sección [Variables de entorno](#-variables-de-entorno)).

### 4. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Generar cliente Prisma y migrar base de datos

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate

# Opcional: cargar datos de prueba
npm run prisma:seed
```

### 6. Ejecutar en modo desarrollo

Abre **dos terminales**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:3000
# → Swagger: http://localhost:3000/api/docs

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

Verifica que el backend responde:

```bash
curl http://localhost:3000/health
```

---

## 🔐 Variables de entorno

### Backend (`backend/.env`)

```env
PORT=3000
DATABASE_URL="postgresql://ecommerce_user:secure_password_123@localhost:5432/ecommerce_db"
JWT_SECRET="tu_jwt_secret_aqui_minimo_32_caracteres"
JWT_REFRESH_SECRET="tu_refresh_secret_aqui_minimo_32_caracteres"
FRONTEND_URL="http://localhost:5173"

# Opcionales
SMTP_HOST=smtp.tuproveedor.com
SMTP_USER=tu@email.com
SMTP_PASS=tu_contraseña
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TAX_PERCENTAGE=18
```

> ⚠️ **Seguridad:** Los JWT secrets deben tener mínimo 32 caracteres. Nunca los subas al repositorio.

---

## 👤 Credenciales de prueba

> Estas cuentas se crean al ejecutar `npm run prisma:seed`.

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@ecommerce.com | Admin123! |
| Gerente de ventas | ventas@ecommerce.com | Ventas123! |
| Gerente de inventario | inventario@ecommerce.com | Inventario123! |
| Vendedor | vendedor@ecommerce.com | Vendedor123! |
| Cliente | cliente1@ecommerce.com | Cliente123! |

---

## ☁️ Despliegue en servidor

### Opción A — VPS (Ubuntu/Debian)

#### 1. Preparar el servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql git nginx
```

#### 2. Instalar Node.js 20 LTS (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

#### 3. Clonar y configurar el proyecto

```bash
cd /var/www
git clone https://github.com/Felixby2004/carrito-compras-react.git
cd carrito-compras-react
```

Configura las variables de entorno en `backend/.env` con valores de **producción**:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://ecommerce_user:TU_PASSWORD_SEGURO@localhost:5432/ecommerce_db"
JWT_SECRET="secreto_muy_largo_y_aleatorio_para_produccion"
JWT_REFRESH_SECRET="otro_secreto_muy_largo_y_aleatorio"
FRONTEND_URL="https://tudominio.com"
```

#### 4. Instalar dependencias y construir

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # solo la primera vez
npm run build

# Frontend
cd ../frontend
npm install
npm run build
# Los archivos estáticos quedan en frontend/dist/
```

#### 5. Configurar PM2 (proceso persistente para el backend)

```bash
npm install -g pm2
cd /var/www/carrito-compras-react/backend
pm2 start npm --name "ecommerce-backend" -- start
pm2 startup   # para que arranque automáticamente al reiniciar
pm2 save
```

#### 6. Configurar Nginx

Crea el archivo `/etc/nginx/sites-available/ecommerce`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend (archivos estáticos)
    root /var/www/carrito-compras-react/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Habilitar HTTPS con Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

El certificado se renueva automáticamente. ✅

---

### Opción B — Plataformas cloud gratuitas / low-cost

| Servicio | Qué alojar | Plan gratuito |
|---------|-----------|--------------|
| [Render](https://render.com) | Backend (Node.js) | ✅ Sí |
| [Railway](https://railway.app) | Backend + PostgreSQL | ✅ Sí (limitado) |
| [Vercel](https://vercel.com) | Frontend (React/Vite) | ✅ Sí |
| [Supabase](https://supabase.com) | PostgreSQL | ✅ Sí |
| [Neon](https://neon.tech) | PostgreSQL serverless | ✅ Sí |

#### Desplegar frontend en Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

#### Desplegar backend en Render

1. Crea un nuevo **Web Service** en Render apuntando a tu repo.
2. Build command: `cd backend && npm install && npm run build`
3. Start command: `cd backend && npm start`
4. Agrega las variables de entorno en el panel de Render.

---

## 📁 Estructura del proyecto

```
carrito-compras-react/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   ├── logs/
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

---

## 📡 API Reference

La documentación completa de la API está disponible en Swagger UI una vez que el backend está corriendo:

```
http://localhost:3000/api/docs
```

Endpoints principales:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| GET | `/api/v1/productos` | Listar productos |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/register` | Registrar usuario |

---

## 🔧 Solución de problemas

| Problema | Causa y solución |
|---------|-----------------|
| No conecta a la BD | PostgreSQL no está corriendo o `DATABASE_URL` es incorrecto |
| CORS error | Verifica `FRONTEND_URL` en `backend/.env` y reinicia el backend |
| JWT_SECRET inválido | Define `JWT_SECRET` y `JWT_REFRESH_SECRET` (mínimo 32 caracteres) |
| Prisma migrate falla | Asegúrate de que la BD exista y el usuario tenga permisos |
| Frontend no llama al backend | El proxy Vite apunta a `http://localhost:3000`; verifica que el backend esté activo |
| No recibo correo | Revisa spam o configura correctamente SMTP en `.env` |
| Pago rechazado | Verifica datos de tarjeta o usa modo prueba de Stripe |
| Error en reportes PDF | Verifica conexión con el servidor |

### Comandos útiles de diagnóstico

```bash
# Ver logs del backend en producción
pm2 logs ecommerce-backend

# Reiniciar backend
pm2 restart ecommerce-backend

# Ver estado de PostgreSQL
sudo systemctl status postgresql

# Probar conexión a la API
curl http://localhost:3000/health
```

---

## 🗄️ Mantenimiento

```bash
# Respaldo de la base de datos
pg_dump ecommerce_db > backup_$(date +%Y%m%d).sql

# Restaurar respaldo
psql ecommerce_db < backup_20260427.sql
```

Los logs del backend se almacenan en `backend/logs/`.

---

## 📄 Licencia

Este proyecto es de uso privado. Versión 1.0 — Abril 2026.
