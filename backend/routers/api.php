<?php
require_once __DIR__ . '/../middleware/security.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ControlObjetivosController.php';
require_once __DIR__ . '/../controllers/UsuarioController.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');

$db = (new Database())->getConnection();
$controller = new ControlObjetivosController($db);
$usuarioController = new UsuarioController($db);

$request = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Rutas de autenticación
if ($request === 'POST' && strpos($path, '/usuario/login') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
    $usuarioController->login($data);
    exit;
} elseif ($request === 'GET' && strpos($path, '/usuario/validarSesion') !== false) {
    if (isset($_SESSION['usuario'])) {
        echo json_encode([
            'success' => true, 
            'data' => [
                'codigo' => $_SESSION['usuario'], 
                'nombre' => $_SESSION['nombre'],
                'rol' => $_SESSION['rol'] ?? 'USER'
            ]
        ]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
} elseif ($request === 'GET' && strpos($path, '/usuario/logout') !== false) {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Obtener todas las granjas
if ($request === 'GET' && strpos($path, '/granjas') !== false) {
    header('Content-Type: application/json');
    
    try {
        $query = "SELECT codigo, nombre FROM ccos 
                  WHERE LENGTH(codigo)=3 
                  AND swac='A' 
                  AND LEFT(codigo,1)='6' 
                  AND codigo NOT IN ('650','668','669','600') 
                  ORDER BY nombre";
        
        $stmt = $db->query($query);
        $granjas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($granjas);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al cargar granjas: ' . $e->getMessage()]);
    }
}

// Obtener galpones por granja
elseif ($request === 'GET' && preg_match('#/galpones/([^/]+)#', $path, $matches)) {
    header('Content-Type: application/json');
    
    try {
        $codigoGranja = $matches[1];
        
        $query = "SELECT tcencos, tcodint, tnomcen 
                  FROM regcencosgalpones 
                  WHERE tcencos = :codigo 
                  ORDER BY tnomcen";
        
        $stmt = $db->prepare($query);
        $stmt->execute(['codigo' => $codigoGranja]);
        $galpones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($galpones);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al cargar galpones: ' . $e->getMessage()]);
    }
}
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
    $controller->deleteSubproceso($matches[1]
    );

}
?>