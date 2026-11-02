<?php
// Configuración central de conexión. En XAMPP normalmente root no tiene contraseña.
$host = 'localhost';
$dbname = 'mi_store_arequipa';
$username = 'root';
$password = '';

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    // No mostrar credenciales ni detalles internos al visitante.
    echo json_encode(['success' => false, 'message' => 'No se pudo conectar con la base de datos. Verifica backend/conexion.php y que MySQL esté iniciado.']);
    exit;
}
