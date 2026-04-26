-- CreateTable
CREATE TABLE "seg_usuarios" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "token_verificacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_ultimo_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "seg_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seg_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_permisos" (
    "id" SERIAL NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seg_rol_permiso" (
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_rol_permiso_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "seg_usuario_rol" (
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_usuario_rol_pkey" PRIMARY KEY ("usuario_id","rol_id")
);

-- CreateTable
CREATE TABLE "seg_refresh_tokens" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seg_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_clientes" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "telefono" VARCHAR(20),
    "fecha_nacimiento" TIMESTAMP(3),
    "total_gastado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_ultima_compra" TIMESTAMP(3),
    "segmento" VARCHAR(20) NOT NULL DEFAULT 'nuevo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cli_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_direcciones" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "alias" VARCHAR(50) NOT NULL,
    "direccion_completa" TEXT NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100) NOT NULL,
    "codigo_postal" VARCHAR(20),
    "telefono" VARCHAR(20) NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cli_direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_lista_deseos" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "nombre_lista" VARCHAR(100) NOT NULL DEFAULT 'Mi lista',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_items_lista_deseos" (
    "id" SERIAL NOT NULL,
    "lista_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "fecha_agregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_items_lista_deseos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_resenas_producto" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "orden_id" INTEGER,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha_resena" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cli_resenas_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cli_historial_navegacion" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER,
    "session_id" VARCHAR(255),
    "producto_id" INTEGER NOT NULL,
    "fecha_visita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tiempo_permanencia_seg" INTEGER,

    CONSTRAINT "cli_historial_navegacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "categoria_padre_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "cat_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_subcategorias" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_marcas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_unidades_medida" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "abreviatura" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_productos" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion_larga" TEXT,
    "categoria_id" INTEGER NOT NULL,
    "subcategoria_id" INTEGER,
    "marca_id" INTEGER,
    "unidad_medida_id" INTEGER NOT NULL,
    "precio_costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_oferta" DECIMAL(10,2),
    "fecha_inicio_oferta" TIMESTAMP(3),
    "fecha_fin_oferta" TIMESTAMP(3),
    "peso" DECIMAL(8,2),
    "ancho" DECIMAL(8,2),
    "alto" DECIMAL(8,2),
    "profundidad" DECIMAL(8,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "cat_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_etiquetas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_etiquetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_etiqueta" (
    "producto_id" INTEGER NOT NULL,
    "etiqueta_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_producto_etiqueta_pkey" PRIMARY KEY ("producto_id","etiqueta_id")
);

-- CreateTable
CREATE TABLE "cat_atributos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_valores_atributo" (
    "id" SERIAL NOT NULL,
    "atributo_id" INTEGER NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_valores_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_producto_atributo" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "atributo_id" INTEGER NOT NULL,
    "valor_id" INTEGER NOT NULL,
    "precio_adicional" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_producto_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_imagenes_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cat_imagenes_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_stock_producto" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "stock_fisico" INTEGER NOT NULL DEFAULT 0,
    "stock_reservado" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "ubicacion_almacen" VARCHAR(100),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_stock_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "tipo_movimiento" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_antes" INTEGER NOT NULL,
    "stock_despues" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "referencia_id" INTEGER,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER,

    CONSTRAINT "inv_movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_proveedores" (
    "id" SERIAL NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "ruc" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "telefono" VARCHAR(20),
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_ordenes_compra" (
    "id" SERIAL NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "numero_oc" VARCHAR(50) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega_estimada" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "usuario_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inv_ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_detalle_orden_compra" (
    "id" SERIAL NOT NULL,
    "orden_compra_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "inv_detalle_orden_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inv_recepciones" (
    "id" SERIAL NOT NULL,
    "orden_compra_id" INTEGER NOT NULL,
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibido_por" INTEGER,
    "observaciones" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completada',

    CONSTRAINT "inv_recepciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_carritos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "session_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_carritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_carrito" (
    "id" SERIAL NOT NULL,
    "carrito_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "variante_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ord_items_carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_cupones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "monto_minimo" DECIMAL(10,2),
    "usos_maximos" INTEGER,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_cupones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_metodos_envio" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,
    "tiempo_estimado" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_metodos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_ordenes" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "cupon_id" INTEGER,
    "metodo_envio_id" INTEGER,
    "orden_numero" VARCHAR(20) NOT NULL,
    "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuesto" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costo_envio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente_pago',
    "metodo_pago" VARCHAR(50),
    "tracking_numero" VARCHAR(100),
    "fecha_entrega" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,
    "updated_by" INTEGER,

    CONSTRAINT "ord_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_items_orden" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "nombre_producto" VARCHAR(255) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_items_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_direcciones_envio" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "direccion_completa" TEXT NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "departamento" VARCHAR(100) NOT NULL,
    "codigo_postal" VARCHAR(20),
    "telefono" VARCHAR(20) NOT NULL,
    "destinatario" VARCHAR(200) NOT NULL,

    CONSTRAINT "ord_direcciones_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_pagos" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" VARCHAR(50) NOT NULL,
    "estado_pago" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "fecha_pago" TIMESTAMP(3),
    "transaccion_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_estados_orden" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(20) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_estados_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ord_historial_estados" (
    "id" SERIAL NOT NULL,
    "orden_id" INTEGER NOT NULL,
    "estado_anterior" VARCHAR(20),
    "estado_nuevo" VARCHAR(20) NOT NULL,
    "comentario" TEXT,
    "usuario_id" INTEGER,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ord_historial_estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monedas" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(3) NOT NULL,
    "simbolo" VARCHAR(5) NOT NULL,
    "tasa_cambio_default" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monedas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_cambio" (
    "id" SERIAL NOT NULL,
    "moneda_origen" VARCHAR(3) NOT NULL,
    "moneda_destino" VARCHAR(3) NOT NULL,
    "tasa" DECIMAL(10,4) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_registro" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(50) NOT NULL,
    "modulo" VARCHAR(50) NOT NULL,
    "tabla" VARCHAR(50) NOT NULL,
    "registro_id" INTEGER,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(45),

    CONSTRAINT "auditoria_registro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seg_usuarios_email_key" ON "seg_usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seg_roles_nombre_key" ON "seg_roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seg_permisos_modulo_accion_key" ON "seg_permisos"("modulo", "accion");

-- CreateIndex
CREATE UNIQUE INDEX "cli_clientes_usuario_id_key" ON "cli_clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cat_categorias_slug_key" ON "cat_categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cat_subcategorias_slug_key" ON "cat_subcategorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cat_marcas_nombre_key" ON "cat_marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_productos_sku_key" ON "cat_productos"("sku");

-- CreateIndex
CREATE INDEX "cat_productos_categoria_id_idx" ON "cat_productos"("categoria_id");

-- CreateIndex
CREATE INDEX "cat_productos_marca_id_idx" ON "cat_productos"("marca_id");

-- CreateIndex
CREATE INDEX "cat_productos_nombre_idx" ON "cat_productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cat_etiquetas_nombre_key" ON "cat_etiquetas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "inv_stock_producto_producto_id_key" ON "inv_stock_producto"("producto_id");

-- CreateIndex
CREATE INDEX "inv_movimientos_inventario_producto_id_idx" ON "inv_movimientos_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "inv_movimientos_inventario_fecha_movimiento_idx" ON "inv_movimientos_inventario"("fecha_movimiento");

-- CreateIndex
CREATE UNIQUE INDEX "inv_proveedores_ruc_key" ON "inv_proveedores"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "inv_ordenes_compra_numero_oc_key" ON "inv_ordenes_compra"("numero_oc");

-- CreateIndex
CREATE UNIQUE INDEX "inv_recepciones_orden_compra_id_key" ON "inv_recepciones"("orden_compra_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_carritos_session_id_key" ON "ord_carritos"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_cupones_codigo_key" ON "ord_cupones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ord_ordenes_orden_numero_key" ON "ord_ordenes"("orden_numero");

-- CreateIndex
CREATE INDEX "ord_ordenes_cliente_id_idx" ON "ord_ordenes"("cliente_id");

-- CreateIndex
CREATE INDEX "ord_ordenes_estado_idx" ON "ord_ordenes"("estado");

-- CreateIndex
CREATE INDEX "ord_ordenes_fecha_orden_idx" ON "ord_ordenes"("fecha_orden");

-- CreateIndex
CREATE UNIQUE INDEX "ord_direcciones_envio_orden_id_key" ON "ord_direcciones_envio"("orden_id");

-- CreateIndex
CREATE UNIQUE INDEX "ord_estados_orden_nombre_key" ON "ord_estados_orden"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "monedas_codigo_key" ON "monedas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE INDEX "auditoria_registro_timestamp_idx" ON "auditoria_registro"("timestamp");

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_rol_permiso" ADD CONSTRAINT "seg_rol_permiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "seg_permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_usuario_rol" ADD CONSTRAINT "seg_usuario_rol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "seg_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seg_refresh_tokens" ADD CONSTRAINT "seg_refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_clientes" ADD CONSTRAINT "cli_clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_direcciones" ADD CONSTRAINT "cli_direcciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_lista_deseos" ADD CONSTRAINT "cli_lista_deseos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "cli_lista_deseos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_items_lista_deseos" ADD CONSTRAINT "cli_items_lista_deseos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_resenas_producto" ADD CONSTRAINT "cli_resenas_producto_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_historial_navegacion" ADD CONSTRAINT "cli_historial_navegacion_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cli_historial_navegacion" ADD CONSTRAINT "cli_historial_navegacion_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_categorias" ADD CONSTRAINT "cat_categorias_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "cat_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_subcategorias" ADD CONSTRAINT "cat_subcategorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "cat_categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_subcategoria_id_fkey" FOREIGN KEY ("subcategoria_id") REFERENCES "cat_subcategorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "cat_marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_productos" ADD CONSTRAINT "cat_productos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "cat_unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_etiqueta" ADD CONSTRAINT "cat_producto_etiqueta_etiqueta_id_fkey" FOREIGN KEY ("etiqueta_id") REFERENCES "cat_etiquetas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_valores_atributo" ADD CONSTRAINT "cat_valores_atributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "cat_atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "cat_atributos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_producto_atributo" ADD CONSTRAINT "cat_producto_atributo_valor_id_fkey" FOREIGN KEY ("valor_id") REFERENCES "cat_valores_atributo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_imagenes_producto" ADD CONSTRAINT "cat_imagenes_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_stock_producto" ADD CONSTRAINT "inv_stock_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_movimientos_inventario" ADD CONSTRAINT "inv_movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "inv_stock_producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_ordenes_compra" ADD CONSTRAINT "inv_ordenes_compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "inv_proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "inv_ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_detalle_orden_compra" ADD CONSTRAINT "inv_detalle_orden_compra_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inv_recepciones" ADD CONSTRAINT "inv_recepciones_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "inv_ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_carritos" ADD CONSTRAINT "ord_carritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "ord_carritos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_carrito" ADD CONSTRAINT "ord_items_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_cupon_id_fkey" FOREIGN KEY ("cupon_id") REFERENCES "ord_cupones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_ordenes" ADD CONSTRAINT "ord_ordenes_metodo_envio_id_fkey" FOREIGN KEY ("metodo_envio_id") REFERENCES "ord_metodos_envio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_items_orden" ADD CONSTRAINT "ord_items_orden_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "cat_productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_direcciones_envio" ADD CONSTRAINT "ord_direcciones_envio_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_direcciones_envio" ADD CONSTRAINT "ord_direcciones_envio_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cli_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_pagos" ADD CONSTRAINT "ord_pagos_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ord_ordenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ord_historial_estados" ADD CONSTRAINT "ord_historial_estados_estado_nuevo_fkey" FOREIGN KEY ("estado_nuevo") REFERENCES "ord_estados_orden"("nombre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_registro" ADD CONSTRAINT "auditoria_registro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "seg_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
