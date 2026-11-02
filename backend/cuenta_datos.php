<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No hay una sesión activa.']);
    exit;
}
require_once __DIR__ . '/conexion.php';
try {
    $usuarioId = (int) $_SESSION['usuario_id'];
    $q = $pdo->prepare('SELECT id,nombre,email,telefono,direccion,distrito,rol FROM usuarios WHERE id=? LIMIT 1');
    $q->execute([$usuarioId]);
    $usuario = $q->fetch();
    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'La cuenta ya no está disponible.']);
        exit;
    }
    $q = $pdo->prepare('SELECT c.producto_id AS id,p.nombre,p.precio,p.imagen,c.cantidad AS quantity FROM carrito_usuario c INNER JOIN productos p ON p.id=c.producto_id WHERE c.usuario_id=? ORDER BY c.actualizado_en DESC');
    $q->execute([$usuarioId]);
    $carrito = $q->fetchAll();
    $q = $pdo->prepare('SELECT p.id,p.nombre,p.precio,p.imagen FROM favoritos_usuario f INNER JOIN productos p ON p.id=f.producto_id WHERE f.usuario_id=? ORDER BY f.creado_en DESC');
    $q->execute([$usuarioId]);
    $favoritos = $q->fetchAll();
    echo json_encode(['success'=>true,'user'=>$usuario,'cart'=>$carrito,'wishlist'=>$favoritos], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'No se pudieron cargar los datos de tu cuenta. Verifica que la migración de carrito y favoritos esté instalada.']);
}
