
<?php
session_start();

require_once __DIR__ . '/conexion.php';

if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    exit('Debes iniciar sesión.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Método no permitido.');
}

// Protección CSRF
if (
    empty($_SESSION['csrf_pedidos']) ||
    empty($_POST['csrf_token']) ||
    !hash_equals($_SESSION['csrf_pedidos'], $_POST['csrf_token'])
) {
    http_response_code(403);
    exit('Solicitud no válida. Recarga la página.');
}

$id = (int)($_POST['pedido_id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    exit('Pedido no válido.');
}

try {
    if (($_SESSION['usuario_rol'] ?? '') === 'admin') {

        // El administrador oculta el pedido para todos.
        $q = $pdo->prepare("
            UPDATE pedidos
            SET eliminado_admin = 1,
                eliminado_admin_en = NOW()
            WHERE id = ?
        ");

        $q->execute([$id]);

        header('Location: ../admin/pedidos.php?eliminado=ok');
        exit;

    } else {

        // El cliente solamente puede ocultar sus propios pedidos.
        $q = $pdo->prepare("
            UPDATE pedidos
            SET oculto_cliente = 1
            WHERE id = ?
              AND usuario_id = ?
              AND COALESCE(eliminado_admin, 0) = 0
        ");

        $q->execute([$id, (int)$_SESSION['usuario_id']]);

        if ($q->rowCount() === 0) {
            http_response_code(404);
            exit('No se encontró el pedido o no tienes permiso para eliminarlo.');
        }

        header('Location: ../perfil.php?pedido_oculto=ok');
        exit;
    }

} catch (Throwable $e) {
    http_response_code(500);
    exit('No se pudo procesar la solicitud.');
}
