USE mi_store_arequipa;

-- Ejecutar UNA SOLA VEZ después de respaldar la base de datos.
ALTER TABLE pedidos
  MODIFY estado ENUM('pendiente_cotizacion_envio','pendiente','confirmado','preparando','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER costo_envio,
  ADD COLUMN codigo_cupon VARCHAR(50) NULL AFTER descuento;

CREATE TABLE IF NOT EXISTS categorias (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL UNIQUE,
 descripcion VARCHAR(255) NULL,
 activa TINYINT(1) NOT NULL DEFAULT 1,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cupones (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 codigo VARCHAR(50) NOT NULL UNIQUE,
 tipo ENUM('porcentaje','monto') NOT NULL DEFAULT 'porcentaje',
 valor DECIMAL(10,2) NOT NULL,
 minimo_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
 usos_maximos INT UNSIGNED NULL,
 usos_actuales INT UNSIGNED NOT NULL DEFAULT 0,
 inicia_en DATETIME NULL,
 vence_en DATETIME NULL,
 activo TINYINT(1) NOT NULL DEFAULT 1,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tarifas_envio (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 provincia VARCHAR(100) NOT NULL,
 distrito VARCHAR(100) NOT NULL,
 costo DECIMAL(10,2) NOT NULL DEFAULT 0,
 dias_estimados VARCHAR(60) NOT NULL DEFAULT '1 a 3 días',
 activa TINYINT(1) NOT NULL DEFAULT 1,
 UNIQUE KEY uq_tarifa_zona(provincia,distrito)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS configuracion (
 clave VARCHAR(100) PRIMARY KEY,
 valor TEXT NULL,
 actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notificaciones (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NULL,
 titulo VARCHAR(180) NOT NULL,
 mensaje TEXT NOT NULL,
 tipo VARCHAR(40) NOT NULL DEFAULT 'general',
 leida TINYINT(1) NOT NULL DEFAULT 0,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chatbot_faq (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pregunta VARCHAR(255) NOT NULL,
 palabras_clave VARCHAR(500) NULL,
 respuesta TEXT NOT NULL,
 activa TINYINT(1) NOT NULL DEFAULT 1,
 orden INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eventos_analitica (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NULL,
 evento VARCHAR(80) NOT NULL,
 pagina VARCHAR(255) NULL,
 producto_id INT UNSIGNED NULL,
 datos JSON NULL,
 ip_hash CHAR(64) NULL,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_evento_fecha(evento,creado_en),
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
 FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria_admin (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 admin_id INT UNSIGNED NULL,
 accion VARCHAR(100) NOT NULL,
 entidad VARCHAR(100) NULL,
 entidad_id VARCHAR(80) NULL,
 detalle TEXT NULL,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(admin_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resenas (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NOT NULL,
 producto_id INT UNSIGNED NOT NULL,
 pedido_id BIGINT UNSIGNED NULL,
 calificacion TINYINT UNSIGNED NOT NULL,
 comentario TEXT NULL,
 estado ENUM('pendiente','publicada','rechazada') NOT NULL DEFAULT 'pendiente',
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_resena_usuario_producto(usuario_id,producto_id),
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
 FOREIGN KEY(pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS producto_detalles (
 producto_id INT UNSIGNED PRIMARY KEY,
 sku VARCHAR(80) NULL,
 marca VARCHAR(80) NOT NULL DEFAULT 'Xiaomi',
 precio_anterior DECIMAL(10,2) NULL,
 garantia VARCHAR(120) NULL,
 especificaciones JSON NULL,
 galeria JSON NULL,
 destacado TINYINT(1) NOT NULL DEFAULT 0,
 FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO categorias(nombre) VALUES
('Celulares'),('Audio y Wearables'),('Hogar'),('Accesorios');
INSERT IGNORE INTO tarifas_envio(provincia,distrito,costo,dias_estimados) VALUES
('Arequipa','Arequipa',5,'1 a 2 días'),('Arequipa','Yanahuara',7,'1 a 2 días'),('Arequipa','Cayma',8,'1 a 2 días'),('Arequipa','Cerro Colorado',10,'1 a 3 días'),('Arequipa','José Luis Bustamante y Rivero',6,'1 a 2 días'),('Arequipa','Paucarpata',7,'1 a 3 días'),('Arequipa','Socabaya',8,'1 a 3 días'),('Arequipa','Mariano Melgar',7,'1 a 3 días'),('Arequipa','Sachaca',10,'1 a 3 días'),('Arequipa','Jacobo Hunter',10,'1 a 3 días');
INSERT IGNORE INTO configuracion(clave,valor) VALUES
('nombre_tienda','Xiaomi Store Arequipa'),('moneda','PEN'),('igv','18'),('whatsapp','51927248132'),('correo_contacto','ventas@mistorearequipa.pe'),('direccion_tienda','Arequipa, Perú'),('mensaje_garantia','Consulta las condiciones de garantía con nuestro equipo.'),('yape_numero',''),('plin_numero',''),('titular_pago',''),('banco_transferencia',''),('cuenta_transferencia',''),('cci_transferencia','');
INSERT INTO chatbot_faq(pregunta,palabras_clave,respuesta,orden) SELECT '¿Realizan envíos en Arequipa?','envio,envíos,delivery,distrito,entrega','Sí. Realizamos entregas en distritos de Arequipa. El costo y tiempo se confirman al registrar tu dirección.',1 WHERE NOT EXISTS (SELECT 1 FROM chatbot_faq);
INSERT INTO chatbot_faq(pregunta,palabras_clave,respuesta,orden) SELECT '¿Qué métodos de pago aceptan?','pago,yape,plin,transferencia,efectivo','Puedes elegir Yape/Plin, transferencia bancaria o efectivo contra entrega. Los pagos digitales se verifican manualmente.',2 WHERE (SELECT COUNT(*) FROM chatbot_faq)<2;
INSERT INTO chatbot_faq(pregunta,palabras_clave,respuesta,orden) SELECT '¿Cómo subo mi comprobante?','comprobante,pago,boleta,yape,plin','Ingresa a Mi cuenta, abre tu pedido y utiliza la opción para subir el comprobante. Administración verificará el pago.',3 WHERE (SELECT COUNT(*) FROM chatbot_faq)<3;
