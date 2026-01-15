<?php
class SubprocesosRepository
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Obtener numero_secuencial de una tarea por UUID
    private function obtenerNumeroSecuencial($idTareaUuid)
    {
        if (empty($idTareaUuid) || $idTareaUuid === 'null' || $idTareaUuid === null) {
            return null;
        }

        $query = "SELECT numero_secuencial FROM proy_subprocesos WHERE id_tarea = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$idTareaUuid]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? (int)$result['numero_secuencial'] : null;
    }

    // Calcular siguiente numero_secuencial GLOBAL (no por objetivo)
    private function obtenerSiguienteNumeroSecuencial($idObjetivo = null)
    {
        $query = "SELECT COALESCE(MAX(numero_secuencial), 0) + 1 as siguiente 
                  FROM proy_subprocesos";
        $stmt = $this->conn->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['siguiente'];
    }

    public function findAll()
    {
        $query = "
            SELECT 
                s.numero_secuencial,
                s.id_tarea,
                s.id_objetivo,
                s.id_tarea_padre,
                s.es_tarea_principal,
                s.nombre_tarea,
                s.duracion_dias,
                s.fecha_inicio,
                s.fecha_fin,
                s.predesesoras,
                s.nombres_recursos,
                s.estado_completado_pendiente,
                o.piloto as objetivo_piloto,
                o.granja as objetivo_granja,
                s.presupuesto
            FROM proy_subprocesos s
            LEFT JOIN proy_ctrl_objetivos o ON s.id_objetivo = o.id
            ORDER BY s.numero_secuencial ASC
        ";
        
        $stmt = $this->conn->query($query);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->convertirNumerosAUuids($tareas);
    }

    public function findByObjetivo($idObjetivo)
    {
        $query = "
            SELECT 
                s.numero_secuencial,
                s.id_tarea,
                s.id_objetivo,
                s.id_tarea_padre,
                s.es_tarea_principal,
                s.nombre_tarea,
                s.duracion_dias,
                s.fecha_inicio,
                s.fecha_fin,
                s.predesesoras,
                s.nombres_recursos,
                s.estado_completado_pendiente,
                s.presupuesto
            FROM proy_subprocesos s
            WHERE s.id_objetivo = ?
            ORDER BY s.numero_secuencial ASC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$idObjetivo]);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $this->convertirNumerosAUuids($tareas);
    }
    
    // Convertir id_tarea_padre de numero_secuencial a UUID para frontend
    private function convertirNumerosAUuids($tareas)
    {
        if (empty($tareas)) return $tareas;
        
        // Crear mapa: numero_secuencial -> UUID
        $mapaNumerosUuid = [];
        foreach ($tareas as $tarea) {
            if (!empty($tarea['numero_secuencial'])) {
                $mapaNumerosUuid[(int)$tarea['numero_secuencial']] = $tarea['id_tarea'];
            }
        }
        
        // Convertir id_tarea_padre de número a UUID
        foreach ($tareas as &$tarea) {
            if (!empty($tarea['id_tarea_padre']) && is_numeric($tarea['id_tarea_padre'])) {
                $numeroPadre = (int)$tarea['id_tarea_padre'];
                $tarea['id_tarea_padre'] = $mapaNumerosUuid[$numeroPadre] ?? null;
            }
        }
        
        return $tareas;
    }

    public function findById($id)
    {
        $query = "SELECT * FROM proy_subprocesos WHERE id_tarea = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function save($data)
    {
        // Validar datos mínimos
        if (empty($data['nombre_tarea'])) {
            throw new Exception('El nombre de la tarea es obligatorio');
        }
        if (empty($data['id_objetivo'])) {
            throw new Exception('El id_objetivo es obligatorio');
        }

        if (!empty($data['id_tarea']) && $this->findById($data['id_tarea'])) {
            // ACTUALIZAR tarea existente
            $numeroPadre = null;
            
            // Manejar id_tarea_padre (puede ser null, '', 'null', o UUID válido)
            if (!empty($data['id_tarea_padre']) && 
                $data['id_tarea_padre'] !== 'null' && 
                $data['id_tarea_padre'] !== null) {
                $numeroPadre = $this->obtenerNumeroSecuencial($data['id_tarea_padre']);
            }
            
            $query = "
                UPDATE proy_subprocesos SET
                    id_objetivo = :id_objetivo,
                    id_tarea_padre = :id_tarea_padre,
                    es_tarea_principal = :es_tarea_principal,
                    nombre_tarea = :nombre_tarea,
                    duracion_dias = :duracion_dias,
                    fecha_inicio = :fecha_inicio,
                    fecha_fin = :fecha_fin,
                    predesesoras = :predesesoras,
                    nombres_recursos = :nombres_recursos,
                    estado_completado_pendiente = :estado_completado_pendiente,
                    presupuesto = :presupuesto
                WHERE id_tarea = :id_tarea
            ";
            
            $stmt = $this->conn->prepare($query);
            $params = [
                ':id_tarea' => $data['id_tarea'],
                ':id_objetivo' => $data['id_objetivo'],
                ':id_tarea_padre' => $numeroPadre,
                ':es_tarea_principal' => $data['es_tarea_principal'] ?? 0,
                ':nombre_tarea' => $data['nombre_tarea'],
                ':duracion_dias' => $data['duracion_dias'] ?? 1,
                ':fecha_inicio' => $data['fecha_inicio'] ?? date('Y-m-d'),
                ':fecha_fin' => $data['fecha_fin'] ?? date('Y-m-d'),
                ':predesesoras' => $data['predesesoras'] ?? null,
                ':nombres_recursos' => $data['nombres_recursos'] ?? null,
                ':estado_completado_pendiente' => $data['estado_completado_pendiente'] ?? 'Pendiente',
                ':presupuesto' => $data['presupuesto'] ?? 0.00
            ];
        } else {
            // INSERTAR nueva tarea
            $data['id_tarea'] = $this->generateUuid();
            
            $numeroPadre = null;
            
            // Manejar id_tarea_padre (puede ser null, '', 'null', o UUID válido)
            if (!empty($data['id_tarea_padre']) && 
                $data['id_tarea_padre'] !== 'null' && 
                $data['id_tarea_padre'] !== null) {
                $numeroPadre = $this->obtenerNumeroSecuencial($data['id_tarea_padre']);
            }
            
            // Calcular siguiente numero_secuencial manualmente
            $numeroSecuencial = $this->obtenerSiguienteNumeroSecuencial($data['id_objetivo']);
            
            $query = "
                INSERT INTO proy_subprocesos (
                    id_tarea, id_objetivo, id_tarea_padre, numero_secuencial, es_tarea_principal, 
                    nombre_tarea, duracion_dias, fecha_inicio, fecha_fin, predesesoras, 
                    nombres_recursos, estado_completado_pendiente, presupuesto
                ) VALUES (
                    :id_tarea, :id_objetivo, :id_tarea_padre, :numero_secuencial, :es_tarea_principal, 
                    :nombre_tarea, :duracion_dias, :fecha_inicio, :fecha_fin, :predesesoras, 
                    :nombres_recursos, :estado_completado_pendiente, :presupuesto
                )
            ";
            
            $stmt = $this->conn->prepare($query);
            $params = [
                ':id_tarea' => $data['id_tarea'],
                ':id_objetivo' => $data['id_objetivo'],
                ':id_tarea_padre' => $numeroPadre,
                ':numero_secuencial' => $numeroSecuencial,
                ':es_tarea_principal' => $data['es_tarea_principal'] ?? 0,
                ':nombre_tarea' => $data['nombre_tarea'],
                ':duracion_dias' => $data['duracion_dias'] ?? 1,
                ':fecha_inicio' => $data['fecha_inicio'] ?? date('Y-m-d'),
                ':fecha_fin' => $data['fecha_fin'] ?? date('Y-m-d'),
                ':predesesoras' => $data['predesesoras'] ?? null,
                ':nombres_recursos' => $data['nombres_recursos'] ?? null,
                ':estado_completado_pendiente' => $data['estado_completado_pendiente'] ?? 'Pendiente',
                ':presupuesto' => $data['presupuesto'] ?? null
            ];
        }
        
        $stmt->execute($params);
        return $data['id_tarea'];
    }

    public function delete($id)
    {
        $query = "DELETE FROM proy_subprocesos WHERE id_tarea = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function countAll()
    {
        $query = "SELECT COUNT(*) as total FROM proy_subprocesos";
        $stmt = $this->conn->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    private function generateUuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
