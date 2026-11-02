-- Ejecutar una sola vez en mi_store_arequipa para normalizar pedidos antiguos.
-- Los estados NULL o vacíos se convierten en 'pendiente'.
UPDATE pedidos
SET estado = 'pendiente'
WHERE estado IS NULL OR TRIM(estado) = '';
