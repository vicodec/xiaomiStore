<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/conexion.php';
$data = json_decode(file_get_contents('php://input'), true) ?? [];
if (empty($_SESSION['usuario_id'])) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Inicia sesión para registrar tu pedido y consultar su historial.']); exit; }
$nombre=trim($data['nombre']??''); $direccion=trim($data['direccion']??''); $provincia=trim($data['provincia']??''); $distrito=trim($data['distrito']??'');
$pago=$data['pago']??''; $items=$data['items']??[];
$metodos=['Yape/Plin','Yape / Plin','Transferencia bancaria','Transferencia BCP/Interbank','Pago contra entrega','Efectivo contra entrega'];
$zonas=json_decode(file_get_contents(__DIR__.'/../data/distritos_arequipa.json'),true) ?: [];
$valido=isset($zonas[$provincia]) && in_array($distrito,$zonas[$provincia],true);
$envios=['Arequipa|Arequipa'=>5,'Arequipa|Yanahuara'=>7,'Arequipa|Cayma'=>8,'Arequipa|Cerro Colorado'=>10,'Arequipa|José Luis Bustamante y Rivero'=>6,'Arequipa|Paucarpata'=>7,'Arequipa|Socabaya'=>8,'Arequipa|Mariano Melgar'=>7,'Arequipa|Sachaca'=>10,'Arequipa|Jacobo Hunter'=>10];
$claveEnvio=$provincia.'|'.$distrito; $porCotizar=!isset($envios[$claveEnvio]);
if (!$nombre || !$direccion || !$valido || !in_array($pago,$metodos,true) || !is_array($items) || count($items)===0) {
  http_response_code(422); echo json_encode(['success'=>false,'message'=>'Revisa los datos de entrega, método de pago y productos.']); exit;
}
try {
  $pdo->beginTransaction();
  $subtotal=0; $validated=[];
  foreach($items as $item) {
    $productId=(int)($item['id']??0); $qty=(int)($item['quantity']??0);
    if($productId<1 || $qty<1 || $qty>20) throw new RuntimeException('Producto o cantidad no válida.');
    $q=$pdo->prepare('SELECT id,nombre,precio,stock FROM productos WHERE id=? AND activo=1 FOR UPDATE'); $q->execute([$productId]); $p=$q->fetch();
    if(!$p || (int)$p['stock']<$qty) throw new RuntimeException('Un producto no está disponible en la cantidad solicitada.');
    $subtotal += (float)$p['precio']*$qty; $validated[]=['product'=>$p,'quantity'=>$qty];
  }
  $shipping=$porCotizar?0.0:(float)$envios[$claveEnvio]; $total=$subtotal+$shipping; $distritoPedido=$provincia.' / '.$distrito; $estadoPedido=$porCotizar?'pendiente_cotizacion_envio':'pendiente';
  $ins=$pdo->prepare("INSERT INTO pedidos (usuario_id,cliente_nombre,direccion,distrito,metodo_pago,subtotal,costo_envio,total,estado) VALUES (?,?,?,?,?,?,?,?,COALESCE(NULLIF(?,''),'pendiente'))");
  $ins->execute([$_SESSION['usuario_id'],$nombre,$direccion,$distritoPedido,$pago,$subtotal,$shipping,$total,$estadoPedido]); $orderId=(int)$pdo->lastInsertId();
  $line=$pdo->prepare('INSERT INTO pedido_detalles (pedido_id,producto_id,nombre_producto,precio_unitario,cantidad) VALUES (?,?,?,?,?)');
  $stock=$pdo->prepare('UPDATE productos SET stock=stock-? WHERE id=?');
  $movement=$pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo) VALUES(?,'salida',?,?)");
  foreach($validated as $v) { $p=$v['product']; $qty=$v['quantity']; $line->execute([$orderId,$p['id'],$p['nombre'],$p['precio'],$qty]); $stock->execute([$qty,$p['id']]); $movement->execute([$p['id'],$qty,'Venta por pedido #'.$orderId]); }
  $pdo->commit();
  echo json_encode(['success'=>true,'message'=>$porCotizar?'Pedido registrado. El envío está pendiente de cotización; coordinaremos el costo contigo.':'Pedido registrado. La tienda confirmará el pago y la entrega.','pedido_id'=>$orderId,'total'=>number_format($total,2,'.',''),'envio_por_cotizar'=>$porCotizar]);
} catch(Throwable $e) {
  if($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400); echo json_encode(['success'=>false,'message'=>$e instanceof RuntimeException?$e->getMessage():'No se pudo registrar el pedido.']);
}
