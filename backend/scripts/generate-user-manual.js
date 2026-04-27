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
const outPath = path.join(outDir, "Manual de Usuario.docx");

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

const subBullet = (text) =>
  new Paragraph({
    text,
    bullet: { level: 1 },
    spacing: { after: 60 },
  });

const codeInline = (text) =>
  new TextRun({
    text,
    font: "Consolas",
    shading: { fill: "F1F5F9" },
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
                text: "Manual de Usuario - Sistema de E-Commerce",
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          h("Índice"),
          p("1. Introducción"),
          p("2. Acceso al sistema"),
          p("3. Módulo de compras (Cliente)"),
          p("   3.1 Registro y perfil"),
          p("   3.2 Navegación y búsqueda de productos"),
          p("   3.3 Ficha de producto"),
          p("   3.4 Carrito de compras"),
          p("   3.5 Proceso de checkout"),
          p("   3.6 Mis órdenes y seguimiento"),
          p("   3.7 Lista de deseos y reseñas"),
          p("4. Panel de administración"),
          p("   4.1 Dashboard y KPIs"),
          p("   4.2 Gestión de productos"),
          p("   4.3 Gestión de inventario"),
          p("   4.4 Gestión de órdenes"),
          p("   4.5 Gestión de clientes"),
          p("   4.6 Reportes PDF"),
          p("   4.7 Estadísticas avanzadas"),
          p("5. Soporte y resolución de problemas"),

          new Paragraph({ text: "", spacing: { before: 400 } }),

          h("1. Introducción", HeadingLevel.HEADING_2),
          p(
            "El sistema de E-Commerce permite a los clientes navegar un catálogo de productos, agregarlos al carrito, realizar compras y dar seguimiento a sus pedidos. Los administradores pueden gestionar productos, inventario, órdenes, clientes y generar reportes operacionales y de gestión."
          ),
          p("Este manual explica paso a paso cómo utilizar todas las funcionalidades del sistema."),

          h("2. Acceso al sistema", HeadingLevel.HEADING_2),
          bullet("URL del sitio: http://localhost:5173 (Entorno de desarrollo)"),
          bullet("Panel de administración: http://localhost:5173/admin"),
          p(
            "Para acceder como cliente, puedes navegar libremente sin autenticación, pero para comprar debes iniciar sesión o registrarte. Los administradores deben usar sus credenciales proporcionadas por el equipo técnico."
          ),

          h("3. Módulo de compras (Cliente)", HeadingLevel.HEADING_2),
          h("3.1 Registro y perfil", HeadingLevel.HEADING_3),
          p("Registro de nuevo cliente:"),
          bullet("1. Haz clic en “Iniciar sesión” en la esquina superior derecha."),
          bullet("2. Selecciona “Registrarse”."),
          bullet("3. Completa el formulario con tu Nombre, Apellido, Correo y Contraseña."),
          bullet("4. Haz clic en “Registrarme”."),

          p("Inicio de sesión:"),
          bullet("1. Haz clic en “Iniciar sesión”."),
          bullet("2. Ingresa tu email y contraseña."),
          bullet("3. Presiona “Entrar”."),

          h("3.2 Navegación y búsqueda de productos", HeadingLevel.HEADING_3),
          bullet("Página principal: Muestra productos destacados y categorías."),
          bullet("Catálogo completo: Accede desde la sección de productos."),
          bullet("Filtros: Puedes filtrar por categoría y rango de precio."),
          bullet("Búsqueda: Escribe palabras clave en la barra superior para encontrar productos específicos."),

          h("3.3 Ficha de producto", HeadingLevel.HEADING_3),
          p("Al hacer clic en un producto, verás:"),
          bullet("Imágenes: Visualiza el producto en detalle."),
          bullet("Precio y Stock: Información actualizada de disponibilidad."),
          bullet("Botones: “Agregar al carrito” y “Agregar a lista de deseos”."),
          bullet("Reseñas: Calificaciones y comentarios de otros compradores."),

          h("3.4 Carrito de compras", HeadingLevel.HEADING_3),
          bullet("Agregar: Selecciona la cantidad y presiona “Agregar al carrito”."),
          bullet("Editar: Abre el carrito para ajustar cantidades o eliminar productos."),
          bullet("Cupones: Aplica códigos de descuento antes de finalizar la compra."),

          h("3.5 Proceso de checkout", HeadingLevel.HEADING_3),
          p("El checkout consta de varios pasos:"),
          bullet("1. Dirección: Selecciona o agrega una dirección de envío."),
          bullet("2. Envío: Elige el método de entrega."),
          bullet("3. Pago: Selecciona tarjeta o transferencia."),
          bullet("4. Confirmación: Revisa el resumen y finaliza el pedido."),

          h("3.6 Mis órdenes y seguimiento", HeadingLevel.HEADING_3),
          p("Desde tu perfil puedes acceder a “Mis órdenes” para:"),
          bullet("Ver el estado actual de tus pedidos (Pendiente, Enviado, etc.)."),
          bullet("Ver detalles de productos y precios."),
          bullet("Descargar comprobantes en PDF."),

          h("3.7 Lista de deseos y reseñas", HeadingLevel.HEADING_3),
          bullet("Deseos: Guarda productos para comprarlos después."),
          bullet("Reseñas: Califica tus productos una vez entregados."),

          h("4. Panel de administración", HeadingLevel.HEADING_2),
          h("4.1 Dashboard y KPIs", HeadingLevel.HEADING_3),
          p("Visualiza métricas clave como ventas totales, ticket promedio y productos más vendidos con gráficos interactivos."),

          h("4.2 Gestión de productos", HeadingLevel.HEADING_3),
          bullet("Crea, edita o elimina productos del catálogo."),
          bullet("Gestiona imágenes, precios y categorías."),

          h("4.3 Gestión de inventario", HeadingLevel.HEADING_3),
          bullet("Controla el stock físico y disponible."),
          bullet("Recibe alertas de stock bajo."),

          h("4.4 Gestión de órdenes", HeadingLevel.HEADING_3),
          bullet("Procesa pedidos, cambia estados y gestiona envíos."),

          h("4.5 Gestión de clientes", HeadingLevel.HEADING_3),
          bullet("Visualiza el historial de compras y datos de contacto de tus clientes."),

          h("4.6 Reportes PDF", HeadingLevel.HEADING_3),
          p("Genera reportes detallados de ventas, inventario y movimientos en formato PDF."),

          h("4.7 Estadísticas avanzadas", HeadingLevel.HEADING_3),
          p("Análisis de tendencias, segmentación de clientes y comportamiento de compra."),

          h("5. Soporte y resolución de problemas", HeadingLevel.HEADING_2),
          simpleTable(
            ["Problema", "Solución"],
            [
              ["No recibo correo", "Revisa spam o solicita reenvío."],
              ["Pago rechazado", "Verifica datos de tarjeta o usa modo prueba."],
              ["Error en reportes", "Verifica conexión con el servidor."],
            ]
          ),

          p("Contacto soporte: soporte@tudominio.com"),
          p("Versión 1.0 - Abril 2026"),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`Manual de Usuario generado exitosamente en: ${outPath}`);
}

main().catch(console.error);
