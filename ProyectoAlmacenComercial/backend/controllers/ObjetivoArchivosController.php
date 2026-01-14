<?php
require_once __DIR__ . '/../config/database.php';

class ObjetivoArchivosController
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Subir y registrar archivos
    public function upload()
    {
        if (!isset($_POST['id_objetivo']) || empty($_POST['id_objetivo'])) {
            http_response_code(400);
            echo json_encode(["error" => "Falta el id_objetivo"]);
            return;
        }
        $id_objetivo = $_POST['id_objetivo'];
        $files = $_FILES['archivos'] ?? null;
        if (!$files) {
            http_response_code(400);
            echo json_encode(["error" => "No se enviaron archivos"]);
            return;
        }
        $uploadDir = __DIR__ . '/../../uploads/objetivos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $result = [];
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
            $ext = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
            $id_ruta = uniqid('arch_', true);
            $filename = $id_ruta . ($ext ? ('.' . $ext) : '');
            $ruta_relativa = 'uploads/objetivos/' . $filename;
            $ruta_absoluta = $uploadDir . $filename;
            if (move_uploaded_file($files['tmp_name'][$i], $ruta_absoluta)) {
                // Guardar en la base de datos
                $stmt = $this->conn->prepare("INSERT INTO proy_objetivo_archivos (id_ruta, id_objetivo, ruta_archivo) VALUES (?, ?, ?)");
                $stmt->execute([$id_ruta, $id_objetivo, $ruta_relativa]);
                $result[] = [
                    'id_ruta' => $id_ruta,
                    'ruta_archivo' => $ruta_relativa
                ];
            }
        }
        echo json_encode(["archivos" => $result]);
    }

    // Obtener archivos por objetivo
    public function getByObjetivo($id_objetivo)
    {
        $stmt = $this->conn->prepare("SELECT id_ruta, ruta_archivo FROM proy_objetivo_archivos WHERE id_objetivo = ?");
        $stmt->execute([$id_objetivo]);
        $archivos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["archivos" => $archivos]);
    }

    // Eliminar archivo
    public function delete($id_ruta)
    {
        $stmt = $this->conn->prepare("SELECT ruta_archivo FROM proy_objetivo_archivos WHERE id_ruta = ?");
        $stmt->execute([$id_ruta]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $ruta = __DIR__ . '/../../' . $row['ruta_archivo'];
            if (file_exists($ruta)) {
                unlink($ruta);
            }
            $stmt = $this->conn->prepare("DELETE FROM proy_objetivo_archivos WHERE id_ruta = ?");
            $stmt->execute([$id_ruta]);
            echo json_encode(["message" => "Archivo eliminado"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Archivo no encontrado"]);
        }
    }
}
