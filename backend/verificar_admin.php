<?php
// Protección común para todas las operaciones administrativas.
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
function exigirAdmin(): void {
    if (empty($_SESSION['usuario_id']) || ($_SESSION['usuario_rol'] ?? '') !== 'admin') {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'No tienes permisos para realizar esta operación.']);
        exit;
    }
}
function validarCsrf(): void {
    $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!$token || empty($_SESSION['csrf_admin']) || !hash_equals($_SESSION['csrf_admin'], $token)) {
        http_response_code(419);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'message' => 'La sesión del formulario venció. Recarga la página e inténtalo otra vez.']);
        exit;
    }
}
