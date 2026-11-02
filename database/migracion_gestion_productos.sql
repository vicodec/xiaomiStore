USE mi_store_arequipa;

-- Ejecuta este archivo solo si ya tenías la base de datos creada y aún no existe
-- la tabla de movimientos de inventario.
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id INT UNSIGNED NOT NULL,
  tipo ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(255) NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id)
    REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
