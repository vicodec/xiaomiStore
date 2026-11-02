<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (empty($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Inicia sesión para sincronizar tu carrito y favoritos.']);
    exit;
}
require_once __DIR__ . '/conexion.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$cart = $data['cart'] ?? [];
$wishlist = $data['wishlist'] ?? [];
if (!is_array($cart) || !is_array($wishlist) || count($cart)>100 || count($wishlist)>200) {
    http_response_code(422); echo json_encode(['success'=>false,'message'=>'Los datos enviados no son válidos.']); exit;
}
try {
    $usuarioId = (int) $_SESSION['usuario_id'];
    $pdo->beginTransaction();
    $del = $pdo->prepare('DELETE FROM carrito_usuario WHERE usuario_id=?');
    $del->execute([$usuarioId]);
    $ins = $pdo->prepare('INSERT INTO carrito_usuario (usuario_id,producto_id,cantidad) SELECT ?,id,? FROM productos WHERE id=? AND activo=1');
    foreach ($cart as $item) {
        $productId = (int)($item['id'] ?? 0);
        $quantity = (int)($item['quantity'] ?? 0);
        if ($productId > 0 && $quantity > 0 && $quantity <= 20) $ins->execute([$usuarioId,$quantity,$productId]);
    }
    $del = $pdo->prepare('DELETE FROM favoritos_usuario WHERE usuario_id=?');
    $del->execute([$usuarioId]);
    $ins = $pdo->prepare('INSERT IGNORE INTO favoritos_usuario (usuario_id,producto_id) SELECT ?,id FROM productos WHERE id=? AND activo=1');
    foreach ($wishlist as $item) {
        $productId = (int)(is_array($item) ? ($item['id'] ?? 0) : $item);
        if ($productId > 0) $ins->execute([$usuarioId,$productId]);
    }
    $pdo->commit();
    echo json_encode(['success'=>true,'message'=>'Carrito y favoritos sincronizados.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'No se pudieron guardar el carrito y los favoritos.']);
}
