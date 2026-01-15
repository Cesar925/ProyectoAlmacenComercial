<?php
require_once __DIR__ . '/../services/ControlObjetivosService.php';
require_once __DIR__ . '/../services/SubprocesosService.php';

class ControlObjetivosController
{
    private $service;
    private $subprocesosService;

    public function __construct($db)
    {
        $this->service = new ControlObjetivosService($db);
        $this->subprocesosService = new SubprocesosService($db);
    }

    public function getAll()
    {
        echo json_encode($this->service->getAll());
    }

    public function getById($id)
    {
        $data = $this->service->getById($id);
        if ($data) {
            echo json_encode($data);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Registro no encontrado"]);
        }
    }

    public function create()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        if (isset($data["id"]) && !empty(trim($data["id"]))) {
            http_response_code(400);
            echo json_encode(["error" => "No se debe enviar un ID al crear un nuevo registro."]);
            return;
        }
        $id = $this->service->save($data);
        echo json_encode(["message" => "Registro creado correctamente", "id" => $id]);
    }

    public function createMultiple()
    {
        $payload = json_decode(file_get_contents("php://input"), true);
        $registros = $payload['registros'] ?? [];
        
        if (empty($registros)) {
            http_response_code(400);
            echo json_encode(["error" => "No se enviaron registros para crear."]);
            return;
        }

        $ids = [];
        foreach ($registros as $data) {
            $id = $this->service->save($data);
            $ids[] = $id;
        }

        echo json_encode([
            "message" => "Registros creados correctamente", 
            "count" => count($ids),
            "ids" => $ids
        ]);
    }

    public function update()
    {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data["id"]) || empty(trim($data["id"]))) {
            http_response_code(400);
            echo json_encode(["error" => "ID inválido para actualizar el registro."]);
            return;
        }
        $this->service->update($data);
        echo json_encode(["message" => "Registro actualizado correctamente"]);
    }

    public function delete($id)
    {
        if (!$id || empty(trim($id))) {
            http_response_code(400);
            echo json_encode(["error" => "ID inválido para eliminar el registro."]);
            return;
        }

        $deletedRows = $this->service->delete($id);

        if ($deletedRows > 0) {
            echo json_encode(["message" => "Registro eliminado correctamente"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No se encontró el registro con el ID especificado."]);
        }
    }

    public function getFiltered()
    {
        $params = [
            'fechaInicio' => $_GET['fechaInicio'] ?? null,
            'fechaFin'    => $_GET['fechaFin'] ?? null,
            'granja'      => $_GET['granja'] ?? null,
            'estado'      => $_GET['estado'] ?? null
        ];

        $datos = $this->service->getFiltered($params);

        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'data' => $datos,
            'total' => count($datos)
        ]);
    }

    // Obtener subprocesos de un objetivo
    public function getSubprocesos($idObjetivo)
    {
        $data = $this->subprocesosService->getByObjetivo($idObjetivo);
        echo json_encode($data);
    }

    // Obtener todos los objetivos y metas individuales de un grupo
    public function getItemsByGrupo($idGrupo)
    {
        $data = $this->service->getItemsByGrupo($idGrupo);
        echo json_encode($data);
    }

    // Crear subproceso
    public function createSubproceso()
    {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["error" => "JSON inválido: " . json_last_error_msg()]);
                return;
            }
            $id = $this->subprocesosService->save($data);
            echo json_encode(["message" => "Tarea creada correctamente", "id" => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error al crear tarea: " . $e->getMessage()]);
        }
    }

    // Actualizar subproceso
    public function updateSubproceso()
    {
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["error" => "JSON inválido: " . json_last_error_msg()]);
                return;
            }
            if (!isset($data["id_tarea"]) || empty(trim($data["id_tarea"]))) {
                http_response_code(400);
                echo json_encode(["error" => "ID inválido para actualizar la tarea."]);
                return;
            }
            $this->subprocesosService->update($data);
            echo json_encode(["message" => "Tarea actualizada correctamente"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar tarea: " . $e->getMessage()]);
        }
    }

    // Eliminar subproceso
    public function deleteSubproceso($id)
    {
        if (!$id || empty(trim($id))) {
            http_response_code(400);
            echo json_encode(["error" => "ID inválido para eliminar la tarea."]);
            return;
        }

        $deletedRows = $this->subprocesosService->delete($id);

        if ($deletedRows > 0) {
            echo json_encode(["message" => "Tarea eliminada correctamente"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "No se encontró la tarea con el ID especificado."]);
        }
    }
}
