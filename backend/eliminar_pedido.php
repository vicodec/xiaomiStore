<?php
session_start();
require_once __DIR__.'/conexion.php';
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit('Método no permitido');}
if(empty($_SESSION['usuario_id'])){http_response_code(401);exit('Debes iniciar sesión.');}
$token=$_POST['csrf_token']??'';
if(empty($_SESSION['csrf_pedidos'])||!hash_equals($_SESSION['csrf_pedidos'],$token)){http_response_code(403);exit('Solicitud no válida. Actualiza la página e inténtalo nuevamente.');}
$id=(int)($_POST['pedido_id']??0);$admin=($_SESSION['usuario_rol']??'')==='admin';
if($id<1){header('Location: '.($admin?'../admin/pedidos.php':'../perfil.php'));exit;}
try{
 $pdo->beginTransaction();
 $sql='SELECT id,usuario_id,estado,comprobante_pago FROM pedidos WHERE id=?'.($admin?'':' AND usuario_id=?').' FOR UPDATE';
 $st=$pdo->prepare($sql);$st->execute($admin?[$id]:[$id,(int)$_SESSION['usuario_id']]);$pedido=$st->fetch(PDO::FETCH_ASSOC);
 if(!$pedido)throw new RuntimeException('No se encontró el pedido o no tienes permiso para eliminarlo.');
 $estado=trim((string)$pedido['estado']);
 if(!$admin && !in_array($estado,['','pendiente','pendiente_cotizacion_envio','cancelado'],true))throw new RuntimeException('Solo puedes borrar pedidos pendientes o cancelados. Para pedidos en preparación o enviados, comunícate con la tienda.');
 $del=$pdo->prepare('DELETE FROM pedidos WHERE id=?');$del->execute([$id]);
 $pdo->commit();
 // El archivo se conserva por seguridad y trazabilidad; no se borra físicamente.
 $_SESSION['pedido_msg']='Pedido #'.$id.' eliminado correctamente.';
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();$_SESSION['pedido_msg']=$e->getMessage();}
header('Location: '.($admin?'../admin/pedidos.php':'../perfil.php'));exit;
