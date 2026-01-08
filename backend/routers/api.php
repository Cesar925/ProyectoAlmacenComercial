<?php
require_once __DIR__ . '/../middleware/security.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ControlObjetivosController.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

$db = (new Database())->getConnection();
$controller = new ControlObjetivosController($db);

$request = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($request === 'GET' && strpos($path, '/controlobjetivos/all') !== false) {
    $controller->getAll();
} elseif ($request === 'GET' && strpos($path, '/controlobjetivos/filtro') !== false) {
    $controller->getFiltered();
} elseif ($request === 'GET' && preg_match('#/controlobjetivos/(\d+|[a-f0-9\-]+)$#i', $path, $matches)) {
    $controller->getById($matches[1]);
} elseif ($request === 'POST' && strpos($path, '/controlobjetivos/crear-multiple') !== false) {
    $controller->createMultiple();
} elseif ($request === 'POST' && strpos($path, '/controlobjetivos/crear') !== false) {
    $controller->create();
} elseif ($request === 'PUT' && strpos($path, '/controlobjetivos/actualizar') !== false) {
    $controller->update();
} elseif ($request === 'DELETE' && preg_match('#/controlobjetivos/borrar/(.+)$#', $path, $matches)) {
    $controller->delete($matches[1]);
} elseif ($request === 'GET' && preg_match('#/controlobjetivos/(.+)/subprocesos$#', $path, $matches)) {
    $controller->getSubprocesos($matches[1]);
} elseif ($request === 'GET' && preg_match('#/controlobjetivos/(.+)/items$#', $path, $matches)) {
    $controller->getItemsByGrupo($matches[1]);
} elseif ($request === 'POST' && strpos($path, '/subprocesos/crear') !== false) {
    $controller->createSubproceso();
} elseif ($request === 'PUT' && strpos($path, '/subprocesos/actualizar') !== false) {
    $controller->updateSubproceso();
} elseif ($request === 'DELETE' && preg_match('#/subprocesos/borrar/(.+)$#', $path, $matches)) {
    $controller->deleteSubproceso($matches[1]);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Ruta no encontrada']);
}
