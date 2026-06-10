-- =====================================
-- ELIMINAR TABLAS EXISTENTES (RESET)
-- =====================================

DROP TABLE IF EXISTS seg_rol_permiso CASCADE;
DROP TABLE IF EXISTS seg_permisos CASCADE;
DROP TABLE IF EXISTS seg_usuario_rol CASCADE;
DROP TABLE IF EXISTS seg_roles CASCADE;
DROP TABLE IF EXISTS seg_refresh_tokens CASCADE;
DROP TABLE IF EXISTS cli_clientes CASCADE;
DROP TABLE IF EXISTS cli_direcciones CASCADE;
DROP TABLE IF EXISTS cli_lista_deseos CASCADE;
DROP TABLE IF EXISTS cli_items_lista_deseos CASCADE;
DROP TABLE IF EXISTS cli_resenas_producto CASCADE;
DROP TABLE IF EXISTS cli_historial_navegacion CASCADE;
DROP TABLE IF EXISTS cat_valores_atributo CASCADE;
DROP TABLE IF EXISTS cat_atributos CASCADE;
DROP TABLE IF EXISTS cat_etiquetas CASCADE;
DROP TABLE IF EXISTS cat_imagenes_producto CASCADE;
DROP TABLE IF EXISTS cat_productos CASCADE;
DROP TABLE IF EXISTS cat_subcategorias CASCADE;
DROP TABLE IF EXISTS cat_categorias CASCADE;
DROP TABLE IF EXISTS cat_marcas CASCADE;
DROP TABLE IF EXISTS cat_unidades_medida CASCADE;
DROP TABLE IF EXISTS inv_stock_producto CASCADE;
DROP TABLE IF EXISTS inv_recepciones CASCADE;
DROP TABLE IF EXISTS inv_detalle_orden_compra CASCADE;
DROP TABLE IF EXISTS inv_ordenes_compra CASCADE;
DROP TABLE IF EXISTS inv_proveedores CASCADE;
DROP TABLE IF EXISTS ord_historial_estados CASCADE;
DROP TABLE IF EXISTS ord_pagos CASCADE;
DROP TABLE IF EXISTS ord_items_orden CASCADE;
DROP TABLE IF EXISTS ord_direcciones_envio CASCADE;
DROP TABLE IF EXISTS ord_estados_orden CASCADE;
DROP TABLE IF EXISTS ord_ordenes CASCADE;
DROP TABLE IF EXISTS ord_items_carrito CASCADE;
DROP TABLE IF EXISTS ord_carritos CASCADE;
DROP TABLE IF EXISTS ord_cupones CASCADE;
DROP TABLE IF EXISTS ord_metodos_envio CASCADE;
DROP TABLE IF EXISTS tipo_cambio CASCADE;
DROP TABLE IF EXISTS monedas CASCADE;
DROP TABLE IF EXISTS configuracion_sistema CASCADE;
DROP TABLE IF EXISTS seg_usuarios CASCADE;

-- =====================================
-- CREAR TABLAS COMPLETAS
-- =====================================

-- TABLAS DE SEGURIDAD
CREATE TABLE seg_usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    token_verificacion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE seg_roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seg_usuario_rol (
    usuario_id INTEGER NOT NULL,
    rol_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, rol_id)
);

CREATE TABLE seg_permisos (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL
);

CREATE TABLE seg_rol_permiso (
    rol_id INTEGER NOT NULL,
    permiso_id INTEGER NOT NULL,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE seg_refresh_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    revocado BOOLEAN NOT NULL DEFAULT FALSE,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLAS DE CLIENTES
CREATE TABLE cli_clientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento TIMESTAMP,
    total_gastado DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha_ultima_compra TIMESTAMP,
    segmento VARCHAR(20) NOT NULL DEFAULT 'nuevo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cli_direcciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    alias VARCHAR(50) NOT NULL,
    direccion_completa TEXT NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    codigo_postal VARCHAR(20),
    telefono VARCHAR(20) NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cli_lista_deseos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    nombre_lista VARCHAR(100) NOT NULL DEFAULT 'Mi lista',
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cli_items_lista_deseos (
    id SERIAL PRIMARY KEY,
    lista_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    variante_id INTEGER,
    fecha_agregado TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cli_resenas_producto (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    orden_id INTEGER,
    calificacion INTEGER NOT NULL,
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cli_historial_navegacion (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER,
    session_id VARCHAR(255),
    producto_id INTEGER NOT NULL,
    fecha_visita TIMESTAMP DEFAULT NOW(),
    tiempo_permanencia_seg INTEGER
);

-- TABLAS DE CATÁLOGO
CREATE TABLE cat_categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    categoria_padre_id INTEGER,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE cat_subcategorias (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cat_marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cat_unidades_medida (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cat_etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(20)
);

CREATE TABLE cat_atributos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL
);

CREATE TABLE cat_valores_atributo (
    id SERIAL PRIMARY KEY,
    atributo_id INTEGER NOT NULL,
    valor VARCHAR(255) NOT NULL
);

CREATE TABLE cat_productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion_corta TEXT,
    descripcion_larga TEXT,
    categoria_id INTEGER NOT NULL,
    subcategoria_id INTEGER,
    marca_id INTEGER,
    unidad_medida_id INTEGER NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_oferta DECIMAL(10,2),
    fecha_inicio_oferta TIMESTAMP,
    fecha_fin_oferta TIMESTAMP,
    peso DECIMAL(8,2),
    ancho DECIMAL(8,2),
    alto DECIMAL(8,2),
    profundidad DECIMAL(8,2),
    ventas_totales INTEGER NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE cat_imagenes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLAS DE INVENTARIO
CREATE TABLE inv_stock_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER UNIQUE NOT NULL,
    variante_id INTEGER,
    stock_fisico INTEGER NOT NULL DEFAULT 0,
    stock_reservado INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 0,
    ubicacion_almacen VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inv_proveedores (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(200) NOT NULL,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inv_ordenes_compra (
    id SERIAL PRIMARY KEY,
    proveedor_id INTEGER NOT NULL,
    numero_oc VARCHAR(50) UNIQUE NOT NULL,
    fecha_emision TIMESTAMP DEFAULT NOW(),
    fecha_entrega_estimada TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    usuario_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inv_detalle_orden_compra (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE inv_recepciones (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER UNIQUE NOT NULL,
    fecha_recepcion TIMESTAMP DEFAULT NOW(),
    recibido_por INTEGER,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'completada'
);

-- TABLAS DE ÓRDENES
CREATE TABLE ord_carritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    session_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_items_carrito (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    variante_id INTEGER,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_cupones (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    monto_minimo DECIMAL(10,2),
    usos_maximos INTEGER,
    usos_actuales INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_metodos_envio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    tiempo_estimado VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_estados_orden (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    orden INTEGER NOT NULL
);

CREATE TABLE ord_ordenes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    cupon_id INTEGER,
    metodo_envio_id INTEGER,
    orden_numero VARCHAR(20) UNIQUE NOT NULL,
    fecha_orden TIMESTAMP DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL,
    impuesto DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
    costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente_pago',
    metodo_pago VARCHAR(50),
    tracking_numero VARCHAR(100),
    fecha_entrega TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

CREATE TABLE ord_items_orden (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_direcciones_envio (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER UNIQUE NOT NULL,
    cliente_id INTEGER NOT NULL,
    direccion_completa TEXT NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    codigo_postal VARCHAR(20),
    telefono VARCHAR(20) NOT NULL,
    destinatario VARCHAR(200) NOT NULL
);

CREATE TABLE ord_pagos (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_pago TIMESTAMP,
    transaccion_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ord_historial_estados (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    comentario TEXT,
    usuario_id INTEGER,
    fecha_cambio TIMESTAMP DEFAULT NOW()
);

-- TABLAS ADICIONALES
CREATE TABLE monedas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    tasa_cambio_default DECIMAL(10,4) NOT NULL
);

CREATE TABLE tipo_cambio (
    id SERIAL PRIMARY KEY,
    moneda_origen VARCHAR(10) NOT NULL,
    moneda_destino VARCHAR(10) NOT NULL,
    tasa DECIMAL(10,4) NOT NULL
);

CREATE TABLE configuracion_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_by INTEGER
);

-- =====================================
-- INSERTS DE DATOS
-- =====================================

-- ROLES
INSERT INTO seg_roles (id, nombre, descripcion) VALUES 
(1, 'ADMIN', 'Administrador del sistema');

-- USUARIO ADMIN (contraseña: Admin123!)
INSERT INTO seg_usuarios (
    id, email, password_hash, email_verificado, activo
) VALUES (
    1, 'admin@sistema.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, TRUE
);

-- RELACION USUARIO ROL
INSERT INTO seg_usuario_rol (usuario_id, rol_id) VALUES (1, 1);

-- PERMISOS
INSERT INTO seg_permisos (id, modulo, accion) VALUES 
(1, 'usuarios', 'crear'),
(2, 'usuarios', 'editar'),
(3, 'usuarios', 'eliminar'),
(4, 'productos', 'crear'),
(5, 'productos', 'editar'),
(6, 'productos', 'eliminar'),
(7, 'categorias', 'crear'),
(8, 'categorias', 'editar'),
(9, 'inventario', 'administrar'),
(10, 'ordenes', 'administrar');

-- ROL-PERMISO
INSERT INTO seg_rol_permiso (rol_id, permiso_id) VALUES 
(1,1), (1,2), (1,3), (1,4), (1,5), (1,6), (1,7), (1,8), (1,9), (1,10);

-- CATEGORIAS
INSERT INTO cat_categorias (id, nombre, slug, descripcion, activo) VALUES 
(1, 'Laptops', 'laptops', 'Computadoras portátiles', TRUE),
(2, 'Componentes', 'componentes', 'Componentes de PC', TRUE),
(3, 'Periféricos', 'perifericos', 'Accesorios para computadora', TRUE),
(4, 'Monitores', 'monitores', 'Pantallas y monitores', TRUE),
(5, 'Almacenamiento', 'almacenamiento', 'SSD y discos', TRUE);

-- SUBCATEGORIAS
INSERT INTO cat_subcategorias (id, categoria_id, nombre, slug, activo) VALUES 
(1, 1, 'Gaming', 'gaming', TRUE),
(2, 1, 'Empresarial', 'empresarial', TRUE),
(3, 2, 'Procesadores', 'procesadores', TRUE),
(4, 2, 'Tarjetas Gráficas', 'tarjetas-graficas', TRUE),
(5, 3, 'Teclados', 'teclados', TRUE),
(6, 3, 'Mouse', 'mouse', TRUE),
(7, 4, 'Monitor Gamer', 'monitor-gamer', TRUE),
(8, 5, 'SSD', 'ssd', TRUE);

-- MARCAS
INSERT INTO cat_marcas (id, nombre, activo) VALUES 
(1, 'Intel', TRUE),
(2, 'AMD', TRUE),
(3, 'NVIDIA', TRUE),
(4, 'Logitech', TRUE),
(5, 'Samsung', TRUE),
(6, 'ASUS', TRUE),
(7, 'Kingston', TRUE);

-- UNIDADES
INSERT INTO cat_unidades_medida (id, nombre, abreviatura) VALUES 
(1, 'Unidad', 'UND');

-- PRODUCTOS
INSERT INTO cat_productos (id, sku, nombre, descripcion_corta, categoria_id, subcategoria_id, marca_id, unidad_medida_id, precio_costo, precio_venta, ventas_totales, estado, activo) VALUES 
(1, 'LAP001', 'ASUS TUF Gaming F15', 'Laptop Gamer Core i7', 1, 1, 6, 1, 3200.00, 3999.00, 0, 'activo', TRUE),
(2, 'CPU001', 'Intel Core i7 14700K', 'Procesador Intel', 2, 3, 1, 1, 1400.00, 1799.00, 0, 'activo', TRUE),
(3, 'GPU001', 'RTX 4070 SUPER', 'Tarjeta gráfica NVIDIA', 2, 4, 3, 1, 2500.00, 3199.00, 0, 'activo', TRUE),
(4, 'SSD001', 'Samsung 990 EVO 1TB', 'SSD NVMe', 5, 8, 5, 1, 250.00, 349.00, 0, 'activo', TRUE),
(5, 'MOU001', 'Logitech G502', 'Mouse Gamer', 3, 6, 4, 1, 120.00, 189.00, 0, 'activo', TRUE),
(6, 'MON001', 'Samsung Odyssey G5', 'Monitor 27 pulgadas', 4, 7, 5, 1, 700.00, 999.00, 0, 'activo', TRUE);

-- ETIQUETAS
INSERT INTO cat_etiquetas (id, nombre, color) VALUES 
(1, 'Nuevo', '#28A745'),
(2, 'Oferta', '#DC3545'),
(3, 'Destacado', '#007BFF');

-- ATRIBUTOS
INSERT INTO cat_atributos (id, nombre, tipo) VALUES 
(1, 'Color', 'texto'),
(2, 'Capacidad', 'texto'),
(3, 'Modelo', 'texto');

-- VALORES ATRIBUTOS
INSERT INTO cat_valores_atributo (id, atributo_id, valor) VALUES 
(1, 1, 'Negro'),
(2, 1, 'Blanco'),
(3, 2, '512GB'),
(4, 2, '1TB'),
(5, 3, 'Gaming');

-- STOCK
INSERT INTO inv_stock_producto (id, producto_id, stock_fisico, stock_reservado, stock_minimo, ubicacion_almacen) VALUES 
(1, 1, 10, 0, 2, 'A1'),
(2, 2, 20, 0, 5, 'A2'),
(3, 3, 8, 0, 2, 'A3'),
(4, 4, 30, 0, 5, 'B1'),
(5, 5, 25, 0, 5, 'B2'),
(6, 6, 12, 0, 2, 'C1');

-- PROVEEDORES
INSERT INTO inv_proveedores (id, razon_social, ruc, email, telefono, direccion, activo) VALUES 
(1, 'Tech Import SAC', '20601234567', 'ventas@techimport.com', '044123456', 'Trujillo', TRUE),
(2, 'Hardware Perú SAC', '20607654321', 'contacto@hardwareperu.com', '044654321', 'Lima', TRUE);

-- CUPONES
INSERT INTO ord_cupones (id, codigo, tipo, valor, usos_actuales, activo) VALUES 
(1, 'BIENVENIDO10', 'porcentaje', 10.00, 0, TRUE);

-- METODOS ENVIO
INSERT INTO ord_metodos_envio (id, nombre, costo, tiempo_estimado, activo) VALUES 
(1, 'Delivery Express', 15.00, '24 horas', TRUE),
(2, 'Delivery Estándar', 8.00, '2-3 días', TRUE);

-- ESTADOS ORDEN
INSERT INTO ord_estados_orden (id, nombre, orden) VALUES 
(1, 'pendiente_pago', 1),
(2, 'pagado', 2),
(3, 'preparando', 3),
(4, 'enviado', 4),
(5, 'entregado', 5),
(6, 'cancelado', 6);

-- MONEDAS
INSERT INTO monedas (id, codigo, simbolo, tasa_cambio_default) VALUES 
(1, 'PEN', 'S/', 1.0000),
(2, 'USD', '$', 3.7500);

-- TIPO CAMBIO
INSERT INTO tipo_cambio (id, moneda_origen, moneda_destino, tasa) VALUES 
(1, 'USD', 'PEN', 3.7500),
(2, 'PEN', 'USD', 0.2667);

-- CONFIGURACION
INSERT INTO configuracion_sistema (id, clave, valor) VALUES 
(1, 'nombre_tienda', 'TechStore'),
(2, 'correo_soporte', 'soporte@techstore.com'),
(3, 'telefono_contacto', '999888777');
