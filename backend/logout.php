<?php
// Cierra la sesión PHP y elimina correctamente la cookie de sesión.
// Compatible con PHP 7.3+ / PHP 8.x (XAMPP actual).
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();

    // En PHP moderno, las opciones se pasan como un único array.
    // La versión anterior pasaba SameSite como un octavo argumento,
    // lo que provoca un fatal error y devuelve HTML en lugar de JSON.
    setcookie(session_name(), '', [
        'expires'  => time() - 42000,
        'path'     => $params['path'] ?: '/',
        'domain'   => $params['domain'],
        'secure'   => (bool) $params['secure'],
        'httponly' => (bool) $params['httponly'],
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}

session_destroy();

$isFetch = strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest'
    || stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

if ($isFetch) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'message' => 'Sesión cerrada correctamente.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Location: ../index.php?sesion=cerrada');
exit;
