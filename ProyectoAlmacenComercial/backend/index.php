<?php
// Evitar re-declarar la sesión y silenciar notices en respuestas JSON
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
ini_set('display_errors', 0);

// Headers CORS para permitir peticiones desde cualquier origen
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Manejo del preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/routers/api.php';
?>

