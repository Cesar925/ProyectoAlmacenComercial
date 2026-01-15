<?php
require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/../services/HistorialService.php';

class UsuarioService {
    private $repo;
    private $historialService;

    public function __construct($db) {
        $this->repo = new UsuarioRepository($db);
        $this->historialService = new HistorialService($db);
    }

    public function autenticar($usuario, $password, $ubicacion) {
        $result = $this->repo->login($usuario, $password);

        if ($result) {
            // $this->historialService->logActionLogin($result['codigo'], $result['nombre'], "LOGIN", "USUARIO - CONEMPRE", null, null, $result, "INICIO DE SESION DE USUARIO", $ubicacion);
            return [
                'success' => true,
                'data' => $result
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos'
            ];
        }
    }
}
