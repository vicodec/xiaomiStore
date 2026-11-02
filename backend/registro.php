<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$nombre = trim($data['nombre'] ?? '');
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';
$telefono = trim($data['telefono'] ?? '');
$direccion = trim($data['direccion'] ?? '');
$distrito = trim($data['distrito'] ?? '');
if (!$nombre || !$email || strlen($password) < 8) {
    http_response_code(422);
    echo json_encode(['success'=>false,'message'=>'Completa nombre y correo. La contraseña debe tener al menos 8 caracteres.']); exit;
}
try {
    $check = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $check->execute([$email]);
    if ($check->fetch()) { http_response_code(409); echo json_encode(['success'=>false,'message'=>'Este correo ya está registrado.']); exit; }
    $stmt = $pdo->prepare('INSERT INTO usuarios (nombre,email,password,telefono,direccion,distrito,rol) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$nombre,$email,password_hash($password,PASSWORD_DEFAULT),$telefono,$direccion,$distrito,'cliente']);
    echo json_encode(['success'=>true,'message'=>'Registro exitoso. Ya puedes iniciar sesión.']);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'No se pudo completar el registro.']); }
