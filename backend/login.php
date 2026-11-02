<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $data['password'] ?? '';
if (!$email || !$password) { http_response_code(422); echo json_encode(['success'=>false,'message'=>'Ingresa tu correo y contraseña.']); exit; }
try {
    $stmt = $pdo->prepare('SELECT id,nombre,email,password,telefono,direccion,distrito,rol FROM usuarios WHERE email=? LIMIT 1');
    $stmt->execute([$email]); $user = $stmt->fetch();
    if (!$user || !password_verify($password,$user['password'])) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Correo o contraseña incorrectos.']); exit; }
    session_regenerate_id(true);
    $_SESSION['usuario_id']=(int)$user['id']; $_SESSION['usuario_nombre']=$user['nombre']; $_SESSION['usuario_rol']=$user['rol'];
    unset($user['password']);
    echo json_encode(['success'=>true,'message'=>'Bienvenido/a, '.$user['nombre'].'.','user'=>$user]);
} catch (Throwable $e) { http_response_code(500); echo json_encode(['success'=>false,'message'=>'Ocurrió un error al iniciar sesión.']); }
