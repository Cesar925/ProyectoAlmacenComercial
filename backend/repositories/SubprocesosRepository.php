<?php

class SubprocesosRepository
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function findAll()
    {
        $query = "
            SELECT 
                s.id_tarea,
                s.id_objetivo,
                s.id_tarea_padre,
                s.es_tarea_principal,
                s.nombre_tarea,
                s.duracion_dias,
                s.fecha_inicio,
                s.fecha_fin,
                s.predecesores,
                s.nombres_recursos,
                s.estado_completado_pendiente,
                o.piloto as objetivo_piloto,
                o.granja as objetivo_granja
            FROM san_subprocesos s
            LEFT JOIN san_ctrl_objetivos o ON s.id_objetivo = o.id
            ORDER BY s.es_tarea_principal DESC, s.fecha_inicio ASC
        ";
        
        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findByObjetivo($idObjetivo)
    {
        $query = "
            SELECT 
                s.id_tarea,
                s.id_objetivo,
                s.id_tarea_padre,
                s.es_tarea_principal,
                s.nombre_tarea,
                s.duracion_dias,
                s.fecha_inicio,
                s.fecha_fin,
                s.predecesores,
                s.nombres_recursos,
                s.estado_completado_pendiente
            FROM san_subprocesos s
            WHERE s.id_objetivo = ?
            ORDER BY s.es_tarea_principal DESC, s.fecha_inicio ASC
        ";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$idObjetivo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = "SELECT * FROM san_subprocesos WHERE id_tarea = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function save($data)
    {
        if (!empty($data['id_tarea']) && $this->findById($data['id_tarea'])) {
            // Actualizar
            $query = "
                UPDATE san_subprocesos SET
                    id_objetivo = :id_objetivo,
                    id_tarea_padre = :id_tarea_padre,
                    es_tarea_principal = :es_tarea_principal,
                    nombre_tarea = :nombre_tarea,
                    duracion_dias = :duracion_dias,
                    fecha_inicio = :fecha_inicio,
                    fecha_fin = :fecha_fin,
                    predecesores = :predecesores,
                    nombres_recursos = :nombres_recursos,
                    estado_completado_pendiente = :estado_completado_pendiente
                WHERE id_tarea = :id_tarea
            ";
            $stmt = $this->conn->prepare($query);
            $params = [
                ':id_tarea' => $data['id_tarea'],
                ':id_objetivo' => $data['id_objetivo'] ?? null,
                ':id_tarea_padre' => $data['id_tarea_padre'] ?? null,
                ':es_tarea_principal' => $data['es_tarea_principal'] ?? 0,
                ':nombre_tarea' => $data['nombre_tarea'] ?? null,
                ':duracion_dias' => $data['duracion_dias'] ?? 0,
                ':fecha_inicio' => $data['fecha_inicio'] ?? null,
                ':fecha_fin' => $data['fecha_fin'] ?? null,
                ':predecesores' => $data['predecesores'] ?? null,
                ':nombres_recursos' => $data['nombres_recursos'] ?? null,
                ':estado_completado_pendiente' => $data['estado_completado_pendiente'] ?? 'Pendiente'
            ];
        } else {
            // Insertar nuevo
            $data['id_tarea'] = $this->generateUuid();
            $query = "
                INSERT INTO san_subprocesos (
                    id_tarea, id_objetivo, id_tarea_padre, es_tarea_principal, nombre_tarea, duracion_dias,
                    fecha_inicio, fecha_fin, predecesores, nombres_recursos, estado_completado_pendiente
                ) VALUES (
                    :id_tarea, :id_objetivo, :id_tarea_padre, :es_tarea_principal, :nombre_tarea, :duracion_dias,
                    :fecha_inicio, :fecha_fin, :predecesores, :nombres_recursos, :estado_completado_pendiente
                )
            ";
            $stmt = $this->conn->prepare($query);
            $params = [
                ':id_tarea' => $data['id_tarea'],
                ':id_objetivo' => $data['id_objetivo'] ?? null,
                ':id_tarea_padre' => $data['id_tarea_padre'] ?? null,
                ':es_tarea_principal' => $data['es_tarea_principal'] ?? 0,
                ':nombre_tarea' => $data['nombre_tarea'] ?? null,
                ':duracion_dias' => $data['duracion_dias'] ?? 0,
                ':fecha_inicio' => $data['fecha_inicio'] ?? null,
                ':fecha_fin' => $data['fecha_fin'] ?? null,
                ':predecesores' => $data['predecesores'] ?? null,
                ':nombres_recursos' => $data['nombres_recursos'] ?? null,
                ':estado_completado_pendiente' => $data['estado_completado_pendiente'] ?? 'Pendiente'
            ];
        }
        
        $stmt->execute($params);
        return $data['id_tarea'];
    }

    public function delete($id)
    {
        $query = "DELETE FROM san_subprocesos WHERE id_tarea = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function countAll()
    {
        $query = "SELECT COUNT(*) as total FROM san_subprocesos";
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
