/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require("docx");

const rootDir = path.resolve(__dirname, "..", "..");
const outDir = path.join(rootDir, "docs");
const outPath = path.join(outDir, "Manual de Instalación.docx");

const h = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });

const p = (text) =>
  new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 100 },
  });

const bullet = (text) =>
  new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });

const codeBlock = (lines) =>
  new Paragraph({
    children: [
      new TextRun({
        text: Array.isArray(lines) ? lines.join("\n") : String(lines),
        font: "Consolas",
        size: 20,
      }),
    ],
    shading: { fill: "F1F5F9" },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    },
    spacing: { before: 80, after: 120 },
  });

const kvTable = (rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph(String(v || ""))],
          }),
        ],
      })
    ),
  });

const simpleTable = (headers, rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((text) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text, bold: true, color: "0F172A" })],
              }),
            ],
            shading: { fill: "EEF2FF" },
          })
        ),
      }),
      ...rows.map((r) =>
        new TableRow({
          children: r.map((cell) =>
            new TableCell({
              children: [new Paragraph(String(cell))],
            })
          ),
        })
      ),
    ],
  });

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Manual de Instalación - Sistema de E-Commerce con Carrito de Compras",
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          p("Proyecto: carrito-compras (frontend + backend)"),

          h("Requisitos previos", HeadingLevel.HEADING_2),
          p("Antes de comenzar, asegúrate de tener instalados los siguientes componentes:"),
          simpleTable(
            ["Componente", "Versión mínima", "Recomendada"],
            [
              ["Node.js", "18+", "20 LTS"],
              ["PostgreSQL", "14+", "16+"],
              ["npm", "9+", "10+"],
              ["Git (opcional)", "2.40+", "Cualquiera"],
              ["Docker (opcional)", "24+", "26+"],
            ]
          ),
          p("También necesitarás una terminal (Windows PowerShell recomendado en Windows)."),

          h("1. Estructura del proyecto", HeadingLevel.HEADING_2),
          p("La estructura del repositorio es:"),
          codeBlock(["carrito-compras/", "├── backend/", "└── frontend/"]),

          h("2. Configurar la base de datos PostgreSQL", HeadingLevel.HEADING_2),
          h("2.1 Crear base de datos", HeadingLevel.HEADING_3),
          p("Crea la base de datos y usuario (ajusta credenciales según tu entorno). Ejemplo en psql:"),
          codeBlock([
            "CREATE USER ecommerce_user WITH PASSWORD 'secure_password_123';",
            "CREATE DATABASE ecommerce_db OWNER ecommerce_user;",
            "GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;",
          ]),
          p("Nota: si ya tienes un usuario/DB configurados, solo asegúrate de tener un `DATABASE_URL` válido."),

          h("3. Configurar variables de entorno", HeadingLevel.HEADING_2),
          h("3.1 Backend", HeadingLevel.HEADING_3),
          p("Copia el archivo de ejemplo y edítalo:"),
          codeBlock([
            "cd backend",
            "copy .env.example .env   # Windows PowerShell",
            "# o",
            "cp .env.example .env     # Linux/Mac",
          ]),
          p("Configura los siguientes valores mínimos:"),
          codeBlock([
            'PORT=3000',
            'DATABASE_URL="postgresql://ecommerce_user:secure_password_123@localhost:5432/ecommerce_db"',
            'JWT_SECRET="tu_jwt_secret_aqui_minimo_32_caracteres"',
            'JWT_REFRESH_SECRET="tu_refresh_secret_aqui_minimo_32_caracteres"',
            'FRONTEND_URL="http://localhost:5173"',
          ]),
          p("Seguridad: Los JWT secrets deben ser cadenas complejas (mínimo 32 caracteres). Nunca los subas al repositorio."),
          h("3.2 Frontend", HeadingLevel.HEADING_3),
          p("Este frontend usa proxy de Vite: las llamadas a `/api/*` se redirigen automáticamente al backend en `http://localhost:3000`."),

          h("4. Instalar dependencias", HeadingLevel.HEADING_2),
          h("4.1 Backend", HeadingLevel.HEADING_3),
          codeBlock(["cd backend", "npm install"]),
          h("4.2 Frontend", HeadingLevel.HEADING_3),
          codeBlock(["cd ../frontend", "npm install"]),

          h("5. Generar el cliente de Prisma y ejecutar migraciones", HeadingLevel.HEADING_2),
          p("El proyecto incluye el esquema Prisma en `backend/prisma/schema.prisma`. Para sincronizar la BD:"),
          codeBlock(["cd backend", "npm run prisma:generate", "npm run prisma:migrate"]),
          p("Opcional: cargar datos semilla (usuarios demo, roles, productos, etc.):"),
          codeBlock(["npm run prisma:seed"]),

          h("6. Ejecutar el sistema en modo desarrollo", HeadingLevel.HEADING_2),
          p("Abre dos terminales:"),
          p("Backend:"),
          codeBlock(["cd backend", "npm run dev"]),
          p("Frontend:"),
          codeBlock(["cd frontend", "npm run dev"]),
          p("Esto iniciará:"),
          bullet("Backend en http://localhost:3000 (Swagger: http://localhost:3000/api/docs)"),
          bullet("Frontend en http://localhost:5173"),
          p("Verifica backend:"),
          codeBlock(["curl http://localhost:3000/health"]),

          h("Credenciales de acceso por defecto (datos semilla)", HeadingLevel.HEADING_2),
          simpleTable(
            ["Rol", "Email", "Contraseña"],
            [
              ["Administrador", "admin@ecommerce.com", "Admin123!"],
              ["Gerente ventas", "ventas@ecommerce.com", "Ventas123!"],
              ["Gerente inventario", "inventario@ecommerce.com", "Inventario123!"],
              ["Vendedor", "vendedor@ecommerce.com", "Vendedor123!"],
              ["Cliente", "cliente1@ecommerce.com", "Cliente123!"],
            ]
          ),
          p("Nota: estos usuarios se crean con `npm run prisma:seed` en el backend."),

          h("7. Construir para producción", HeadingLevel.HEADING_2),
          h("7.1 Backend", HeadingLevel.HEADING_3),
          codeBlock(["cd backend", "npm run build", "npm start"]),
          h("7.2 Frontend", HeadingLevel.HEADING_3),
          codeBlock(["cd frontend", "npm run build", "npm run preview"]),

          h("8. Verificar el correcto funcionamiento", HeadingLevel.HEADING_2),
          bullet("Swagger UI: http://localhost:3000/api/docs"),
          bullet("Productos: GET http://localhost:3000/api/v1/productos"),
          bullet("Login: POST http://localhost:3000/api/v1/auth/login"),
          p("En el frontend:"),
          bullet("Navegar por el catálogo"),
          bullet("Agregar productos al carrito"),
          bullet("Realizar checkout"),
          bullet("Ver 'Mis órdenes' y descargar factura PDF"),

          h("9. Solución de problemas comunes", HeadingLevel.HEADING_2),
          simpleTable(
            ["Problema", "Posible causa y solución"],
            [
              ["No conecta a la BD", "PostgreSQL no está corriendo o `DATABASE_URL` es incorrecto."],
              ["CORS error", "Verifica `FRONTEND_URL` en `backend/.env` y reinicia backend."],
              ["JWT_SECRET inválido", "Define `JWT_SECRET` y `JWT_REFRESH_SECRET` (mínimo 32 caracteres)."],
              ["Prisma migrate falla", "Asegúrate de que la base exista y que el usuario tenga permisos."],
              ["Frontend no llama al backend", "El proxy de Vite apunta a http://localhost:3000; verifica que el backend esté arriba."],
            ]
          ),

          h("10. Configuración adicional (opcional)", HeadingLevel.HEADING_2),
          bullet("Email (Nodemailer): configura SMTP_HOST, SMTP_USER, SMTP_PASS."),
          bullet("Stripe (opcional): configura STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET."),

          h("11. Personalización del sistema", HeadingLevel.HEADING_2),
          bullet("Colores: desde el panel admin en 'Configuración del sistema' (colores globales)."),
          bullet("Impuesto: `TAX_PERCENTAGE` en `backend/.env` (por defecto 18)."),

          h("12. Respaldo y mantenimiento", HeadingLevel.HEADING_2),
          bullet("Respaldo de base de datos: usa `pg_dump` sobre tu DB."),
          bullet("Logs backend: se almacenan en `backend/logs/`."),

          h("Conclusión", HeadingLevel.HEADING_2),
          p("Siguiendo este manual, tendrás el sistema funcionando en entorno local. Si surge un error, revisa logs del backend y consola del navegador (F12)."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`OK: manual generado en ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

