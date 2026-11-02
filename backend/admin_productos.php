<?php
require_once __DIR__ . '/verificar_admin.php';
exigirAdmin();
require_once __DIR__ . '/conexion.php';
header('Content-Type: application/json; charset=utf-8');

function responder(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function texto(string $key, int $max = 180): string {
    $value = trim((string)($_POST[$key] ?? ''));
    if (mb_strlen($value) > $max) responder(['success'=>false,'message'=>"El campo {$key} es demasiado largo."], 422);
    return $value;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $rows = $pdo->query('SELECT id,nombre,descripcion,precio,stock,imagen,categoria,activo,creado_en FROM productos ORDER BY id DESC')->fetchAll();
        responder(['success'=>true,'products'=>$rows]);
    } catch (Throwable $e) { responder(['success'=>false,'message'=>'No se pudieron cargar los productos.'],500); }
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(['success'=>false,'message'=>'Método no permitido.'],405);
validarCsrf();
$action = $_POST['action'] ?? '';

try {
    if ($action === 'crear' || $action === 'actualizar') {
        $id = (int)($_POST['id'] ?? 0);
        $nombre = texto('nombre',180);
        $descripcion = texto('descripcion',5000);
        $categoria = texto('categoria',100);
        $precioRaw = str_replace(',', '.', trim((string)($_POST['precio'] ?? '')));
        $stockRaw = trim((string)($_POST['stock'] ?? ''));
        $precio = filter_var($precioRaw, FILTER_VALIDATE_FLOAT);
        $stock = filter_var($stockRaw, FILTER_VALIDATE_INT);
        if ($nombre === '' || $categoria === '' || $precio === false || $precio < 0 || $stock === false || $stock < 0) {
            responder(['success'=>false,'message'=>'Completa nombre y categoría. El precio y stock deben ser números válidos y no negativos.'],422);
        }
        $imagen = trim((string)($_POST['imagen_actual'] ?? ''));
        $imagenUrl = trim((string)($_POST['imagen_url'] ?? ''));
        if ($imagenUrl !== '') {
            if (preg_match('~^(?:https?:)?//~i', $imagenUrl)) {
                if (str_starts_with($imagenUrl, '//')) $imagenUrl = 'https:' . $imagenUrl;
                if (!filter_var($imagenUrl, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($imagenUrl, PHP_URL_SCHEME)), ['http','https'], true)) {
                    responder(['success'=>false,'message'=>'El enlace de imagen debe ser una URL HTTP o HTTPS válida.'],422);
                }
                $imagen = $imagenUrl;
            } else {
                responder(['success'=>false,'message'=>'El enlace de imagen debe comenzar con http:// o https://.'],422);
            }
        }
        if (!empty($_FILES['imagen']['name'])) {
            if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) responder(['success'=>false,'message'=>'No se pudo recibir la imagen.'],422);
            if ($_FILES['imagen']['size'] > 4 * 1024 * 1024) responder(['success'=>false,'message'=>'La imagen supera el límite de 4 MB.'],422);
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($_FILES['imagen']['tmp_name']);
            $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
            if (!isset($allowed[$mime])) responder(['success'=>false,'message'=>'Formato no permitido. Usa JPG, PNG o WEBP.'],422);
            $uploadDir = dirname(__DIR__) . '/uploads/productos/';
            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) responder(['success'=>false,'message'=>'No se pudo crear la carpeta de imágenes.'],500);
            $fileName = 'producto_' . bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
            if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $uploadDir . $fileName)) responder(['success'=>false,'message'=>'No se pudo guardar la imagen.'],500);
            $imagen = 'uploads/productos/' . $fileName;
        }
        $activo = isset($_POST['activo']) ? 1 : 0;
        if ($action === 'crear') {
            $stmt = $pdo->prepare('INSERT INTO productos(nombre,descripcion,precio,stock,imagen,categoria,activo) VALUES(?,?,?,?,?,?,?)');
            $stmt->execute([$nombre,$descripcion,$precio,$stock,$imagen,$categoria,$activo]);
            $id = (int)$pdo->lastInsertId();
            if ($stock > 0) {
                $m = $pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo) VALUES(?,'entrada',?,'Stock inicial del producto')");
                $m->execute([$id,$stock]);
            }
            responder(['success'=>true,'message'=>'Producto creado correctamente.','id'=>$id]);
        }
        if ($id < 1) responder(['success'=>false,'message'=>'ID de producto no válido.'],422);
        $old = $pdo->prepare('SELECT stock FROM productos WHERE id=?'); $old->execute([$id]); $oldStock = $old->fetchColumn();
        if ($oldStock === false) responder(['success'=>false,'message'=>'El producto no existe.'],404);
        $stmt = $pdo->prepare('UPDATE productos SET nombre=?,descripcion=?,precio=?,stock=?,imagen=?,categoria=?,activo=? WHERE id=?');
        $stmt->execute([$nombre,$descripcion,$precio,$stock,$imagen,$categoria,$activo,$id]);
        $delta = $stock - (int)$oldStock;
        if ($delta !== 0) {
            $m = $pdo->prepare('INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo) VALUES(?,?,?,?)');
            $m->execute([$id,$delta > 0 ? 'entrada' : 'salida',abs($delta),'Ajuste desde el panel administrativo']);
        }
        responder(['success'=>true,'message'=>'Producto actualizado correctamente.']);
    }

    if ($action === 'eliminar') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id < 1) responder(['success'=>false,'message'=>'ID de producto no válido.'],422);
        // Baja lógica: conserva el historial de pedidos y evita romper referencias.
        $stmt = $pdo->prepare('UPDATE productos SET activo=0 WHERE id=?'); $stmt->execute([$id]);
        if (!$stmt->rowCount()) {
            $check=$pdo->prepare('SELECT id FROM productos WHERE id=?'); $check->execute([$id]);
            if (!$check->fetchColumn()) responder(['success'=>false,'message'=>'El producto no existe.'],404);
        }
        responder(['success'=>true,'message'=>'Producto desactivado y ocultado de la tienda.']);
    }
    if ($action === 'cambiar_estado') {
        $id = (int)($_POST['id'] ?? 0); $activo = (int)($_POST['activo'] ?? -1);
        if ($id < 1 || !in_array($activo,[0,1],true)) responder(['success'=>false,'message'=>'Datos no válidos.'],422);
        $stmt=$pdo->prepare('UPDATE productos SET activo=? WHERE id=?'); $stmt->execute([$activo,$id]);
        responder(['success'=>true,'message'=>'Estado del producto actualizado.']);
    }
    responder(['success'=>false,'message'=>'Operación desconocida.'],400);
} catch (PDOException $e) {
    responder(['success'=>false,'message'=>'No se pudo guardar el producto. Verifica los datos y la estructura de la base de datos.'],500);
} catch (Throwable $e) {
    responder(['success'=>false,'message'=>'Ocurrió un error al procesar el producto.'],500);
}
