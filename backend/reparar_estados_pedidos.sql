-- Reparar pedidos antiguos que quedaron con estado vacío.
-- Ejecutar una sola vez en phpMyAdmin, base de datos mi_store_arequipa.
UPDATE pedidos
SET estado = CASE
    WHEN COALESCE(costo_envio, 0) <= 0 THEN 'pendiente_cotizacion_envio'
    ELSE 'pendiente'
END
WHERE estado IS NULL OR TRIM(estado) = '';
