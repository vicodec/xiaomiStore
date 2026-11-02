<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/conexion.php';
$input=json_decode(file_get_contents('php://input'),true)??[];$message=mb_strtolower(trim($input['message']??''));
if($message===''){http_response_code(422);echo json_encode(['success'=>false,'message'=>'Escribe una consulta.']);exit;}
try{$rows=$pdo->query("SELECT pregunta,palabras_clave,respuesta FROM chatbot_faq WHERE activa=1 ORDER BY orden,id")->fetchAll();$best=null;$score=0;foreach($rows as $r){$terms=array_filter(array_map('trim',explode(',',mb_strtolower(($r['pregunta']??'').','.($r['palabras_clave']??'')))));$s=0;foreach($terms as $term){if(mb_strlen($term)>2 && mb_strpos($message,$term)!==false)$s+=mb_strlen($term);}if($s>$score){$score=$s;$best=$r;}}$answer=$best?$best['respuesta']:'No encontré una respuesta exacta. Puedes consultar con nuestro equipo por WhatsApp para recibir ayuda personalizada.';echo json_encode(['success'=>true,'answer'=>$answer,'matched'=>(bool)$best],JSON_UNESCAPED_UNICODE);}catch(Throwable $e){http_response_code(500);echo json_encode(['success'=>false,'message'=>'Asistente temporalmente no disponible.']);}
