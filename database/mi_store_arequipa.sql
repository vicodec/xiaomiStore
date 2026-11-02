CREATE DATABASE IF NOT EXISTS mi_store_arequipa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mi_store_arequipa;

CREATE TABLE IF NOT EXISTS usuarios (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(120) NOT NULL, email VARCHAR(160) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL, telefono VARCHAR(30) NULL,
 direccion VARCHAR(255) NULL, distrito VARCHAR(100) NULL,
 rol ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(180) NOT NULL, descripcion TEXT NULL,
 precio DECIMAL(10,2) NOT NULL DEFAULT 0, stock INT UNSIGNED NOT NULL DEFAULT 0,
 imagen TEXT NULL, categoria VARCHAR(100) NOT NULL,
 activo TINYINT(1) NOT NULL DEFAULT 1,
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_productos_categoria(categoria), INDEX idx_productos_activo(activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT UNSIGNED NULL, cliente_nombre VARCHAR(120) NOT NULL,
 direccion VARCHAR(255) NOT NULL, distrito VARCHAR(100) NOT NULL,
 metodo_pago VARCHAR(60) NOT NULL, subtotal DECIMAL(10,2) NOT NULL,
 costo_envio DECIMAL(10,2) NOT NULL, total DECIMAL(10,2) NOT NULL,
 estado ENUM('pendiente','confirmado','preparando','enviado','entregado','cancelado') DEFAULT 'pendiente',
 creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_pedido_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_detalles (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 pedido_id BIGINT UNSIGNED NOT NULL, producto_id INT UNSIGNED NULL,
 nombre_producto VARCHAR(180) NOT NULL, precio_unitario DECIMAL(10,2) NOT NULL,
 cantidad INT UNSIGNED NOT NULL,
 CONSTRAINT fk_detalle_pedido FOREIGN KEY(pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
 CONSTRAINT fk_detalle_producto FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, producto_id INT UNSIGNED NOT NULL,
 tipo ENUM('entrada','salida','ajuste') NOT NULL, cantidad INT NOT NULL,
 motivo VARCHAR(255) NULL, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

-- Productos iniciales: puedes editar precios, stock e imágenes desde la tabla productos.
INSERT INTO productos (nombre,descripcion,precio,stock,imagen,categoria) VALUES
('Redmi Note 13','8GB + 256GB, pantalla AMOLED 120Hz, cámara 108MP.',799,10,'https://tienda.movistar.com.pe/media/catalog/product/cache/07b60579cf7aa09974599885aacbcf02/t/m/tmgpexiren13nes001_340x600_back.png','Celulares'),
('Redmi 13C','4GB + 128GB, batería 5000mAh, cámara 50MP.',429,10,'https://oechsle.vteximg.com.br/arquivos/ids/16995531/image-842ebd3aa939436cb9d0beff34826ebb.jpg?v=638378732997630000','Celulares'),
('POCO X6 Pro','Potente rendimiento para juegos y multitarea.',1199,8,'','Celulares'),
('Xiaomi 14T','Smartphone de alto rendimiento.',2399,5,'','Celulares'),
('Redmi A3','Equipo práctico para el día a día.',299,12,'','Celulares'),
('Xiaomi Smart Band 9','Pulsera inteligente con seguimiento de actividad.',189,15,'','Audio y Wearables'),
('Redmi Watch 5','Reloj inteligente con pantalla amplia.',349,10,'','Audio y Wearables'),
('Redmi Buds 6','Audífonos inalámbricos.',129,20,'','Audio y Wearables'),
('Xiaomi Buds 5 Pro','Audífonos premium inalámbricos.',599,6,'','Audio y Wearables'),
('Redmi Pad SE','Tablet para entretenimiento y estudio.',549,7,'','Audio y Wearables'),
('Robot Vacuum E5','Aspiradora robot inteligente.',699,5,'','Hogar'),
('Smart Air Fryer 6L','Freidora de aire inteligente.',389,6,'','Hogar'),
('Purificador de Aire 4 Lite','Purificador de aire para el hogar.',469,5,'','Hogar'),
('Cámara de Seguridad C300','Cámara de seguridad para interiores.',159,15,'','Hogar'),
('Xiaomi TV A 43 pulgadas','Televisor inteligente de 43 pulgadas.',1099,4,'','Hogar'),
('Power Bank 20000 mAh','Batería portátil de alta capacidad.',109,20,'','Accesorios'),
('Cargador Turbo 67W','Cargador de carga rápida.',89,25,'','Accesorios'),
('Parlante Bluetooth Portátil','Parlante inalámbrico portátil.',149,10,'','Accesorios'),
('Scooter Eléctrico 4 Lite','Scooter eléctrico plegable.',1499,3,'','Accesorios'),
('Router WiFi 6 AX3000','Router de alta velocidad.',259,8,'','Accesorios');
