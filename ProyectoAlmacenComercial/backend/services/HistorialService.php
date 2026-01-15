<?php

class HistorialService {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function logActionLogin($codigo, $nombre, $accion, $tabla, $idRegistro = null, $datosAnteriores = null, $datosNuevos = null, $descripcion = '', $ubicacionGPS = null) {
        try {
            // Aquí puedes implementar el registro de historial según tu necesidad
            // Por ahora, simplemente retornamos true para no bloquear el flujo
            
            // Si necesitas guardar en una tabla de historial/auditoría, crea la tabla y descomenta:
            /*
            $sql = "INSERT INTO historial_accesos 
                    (usuario_codigo, usuario_nombre, accion, tabla, id_registro, datos_anteriores, datos_nuevos, descripcion, ubicacion_gps, fecha_hora) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $codigo,
                $nombre,
                $accion,
                $tabla,
                $idRegistro,
                json_encode($datosAnteriores),
                json_encode($datosNuevos),
                $descripcion,
                $ubicacionGPS
            ]);
            */
            
            return true;
        } catch (Exception $e) {
            // En caso de error en el log, no bloqueamos el login
            error_log("Error en HistorialService: " . $e->getMessage());
            return false;
        }
    }
}
