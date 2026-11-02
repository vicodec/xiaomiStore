<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';

try {
    // La consulta principal no depende de la tabla de reseñas: así un problema
    // con esa función no impide que los productos activos aparezcan en la tienda.
    $stmt = $pdo->query(
        "SELECT id, nombre, descripcion, precio, stock, imagen, categoria, activo
         FROM productos
         WHERE activo = 1
         ORDER BY id DESC"
    );
    $productos = $stmt->fetchAll();

    // Las reseñas son un dato complementario. Si la migración aún no se ejecutó
    // o la tabla no está disponible, el catálogo se sirve igualmente.
    foreach ($productos as &$producto) {
        $producto['promedio_resenas'] = 0;
        $producto['total_resenas'] = 0;
    }
    unset($producto);

    if ($productos) {
        try {
            $resenasStmt = $pdo->query(
                "SELECT producto_id, AVG(calificacion) AS promedio_resenas, COUNT(*) AS total_resenas
                 FROM resenas
                 WHERE estado = 'publicada'
                 GROUP BY producto_id"
            );
            $resenasPorProducto = [];
            foreach ($resenasStmt->fetchAll() as $resena) {
                $resenasPorProducto[(int) $resena['producto_id']] = $resena;
            }

            foreach ($productos as &$producto) {
                $resena = $resenasPorProducto[(int) $producto['id']] ?? null;
                if ($resena) {
                    $producto['promedio_resenas'] = (float) $resena['promedio_resenas'];
                    $producto['total_resenas'] = (int) $resena['total_resenas'];
                }
            }
            unset($producto);
        } catch (Throwable $e) {
            // Sin reseñas disponibles, se muestran los productos con valores por defecto.
        }
    }

    echo json_encode(
        ['success' => true, 'products' => $productos],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudieron obtener los productos. Verifica la conexión y la tabla productos.'
    ], JSON_UNESCAPED_UNICODE);
}
