USE mi_store_arequipa;

-- Extiende pedidos para comprobantes y validación manual de pagos.
ALTER TABLE pedidos
  ADD COLUMN comprobante_pago VARCHAR(255) NULL,
  ADD COLUMN pago_verificado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN pago_verificado_en DATETIME NULL;

-- Reseñas vinculadas a clientes y productos. Una reseña por cliente/producto.
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
 CONSTRAINT fk_resena_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
 CONSTRAINT fk_resena_producto FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
 CONSTRAINT fk_resena_pedido FOREIGN KEY(pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ejecuta este archivo una sola vez sobre la base existente.
