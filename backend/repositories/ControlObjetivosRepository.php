<?php

class ControlObjetivosRepository
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
            o.id,
            o.piloto,
            o.granja,
            o.galpon,
            o.objetivo,
            o.meta,
            o.inicio,
            o.fin,
            o.estado,
            o.fecha_fin_real,        -- Nuevo campo
            o.presupuesto_ejecutado, -- Nuevo campo
            o.observaciones_cierre,  -- Nuevo campo
            (SELECT COUNT(*) FROM proy_subprocesos s WHERE s.id_objetivo = o.id) as total_tareas,
            (SELECT COUNT(*) FROM proy_subprocesos s WHERE s.id_objetivo = o.id AND s.estado_completado_pendiente = 'Completado') as tareas_completadas
        FROM proy_ctrl_objetivos o
        ORDER BY o.inicio DESC
    ";

        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById($id)
    {
        $query = "SELECT * FROM proy_ctrl_objetivos WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function save($data)
{
    $id = $data['id'] ?? $this->generateUuid();

    // Si existe, actualizar
    if (!empty($data['id']) && $this->findById($data['id'])) {
        $query = "
            UPDATE proy_ctrl_objetivos SET
                piloto = :piloto,
                granja = :granja,
                galpon = :galpon,
                objetivo = :objetivo,
                meta = :meta,
                inicio = :inicio,
                fin = :fin,
                estado = :estado,
                fecha_fin_real = :fecha_fin_real,           -- Nuevo
                presupuesto_ejecutado = :presupuesto_ejecutado, -- Nuevo
                observaciones_cierre = :observaciones_cierre    -- Nuevo
            WHERE id = :id
        ";
    } else {
        $query = "
            INSERT INTO proy_ctrl_objetivos (
                id, piloto, granja, galpon, objetivo, meta, inicio, fin, estado, 
                fecha_fin_real, presupuesto_ejecutado, observaciones_cierre
            ) VALUES (
                :id, :piloto, :granja, :galpon, :objetivo, :meta, :inicio, :fin, :estado,
                :fecha_fin_real, :presupuesto_ejecutado, :observaciones_cierre
            )
        ";
    }

    $stmt = $this->conn->prepare($query);
    
    // Obtener valores actuales si es una actualización parcial (para no borrar datos al editar)
    $actual = !empty($data['id']) ? $this->findById($data['id']) : [];

    $stmt->execute([
        ':id' => $id,
        ':piloto'   => $data['piloto']   ?? $actual['piloto']   ?? null,
        ':granja'   => $data['granja']   ?? $actual['granja']   ?? null,
        ':galpon'   => $data['galpon']   ?? $actual['galpon']   ?? null,
        ':objetivo' => $data['objetivo'] ?? $actual['objetivo'] ?? null,
        ':meta'     => $data['meta']     ?? $actual['meta']     ?? null,
        ':inicio'   => $data['inicio']   ?? $actual['inicio']   ?? null,
        ':fin'      => $data['fin']      ?? $actual['fin']      ?? null,
        ':estado'   => $data['estado']   ?? $actual['estado']   ?? 'Pendiente',
        // Nuevos campos
        ':fecha_fin_real'        => $data['fecha_fin_real']        ?? $actual['fecha_fin_real']        ?? null,
        ':presupuesto_ejecutado' => $data['presupuesto_ejecutado'] ?? $actual['presupuesto_ejecutado'] ?? 0.00,
        ':observaciones_cierre'  => $data['observaciones_cierre']  ?? $actual['observaciones_cierre']  ?? null
    ]);

    return $id;
}

    public function delete($id)
    {
        // Eliminar subprocesos asociados
        $stmt = $this->conn->prepare("DELETE FROM proy_subprocesos WHERE id_objetivo = ?");
        $stmt->execute([$id]);

        // Eliminar objetivo
        $stmt = $this->conn->prepare("DELETE FROM proy_ctrl_objetivos WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount();
    }

    public function countAll()
    {
        $query = "SELECT COUNT(*) as total FROM proy_ctrl_objetivos";
        $stmt = $this->conn->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $result['total'];
    }

    // Obtener un registro específico por ID (para subprocesos)
    public function findItemById($id)
    {
        return $this->findById($id);
    }

    // Retornar lista de objetivos y metas de un registro como items separados
    public function findItemsByGrupo($id)
    {
        $record = $this->findById($id);
        if (!$record) {
            return [];
        }

        $items = [];
        $objetivos = preg_split('/\r?\n/', $record['objetivo'] ?? '', -1, PREG_SPLIT_NO_EMPTY);
        foreach ($objetivos as $i => $obj) {
            $items[] = [
                'id' => $record['id'] . '-obj-' . $i,
                'tipo' => 'objetivo',
                'descripcion' => trim($obj)
            ];
        }

        $metas = preg_split('/\r?\n/', $record['meta'] ?? '', -1, PREG_SPLIT_NO_EMPTY);
        foreach ($metas as $i => $meta) {
            $items[] = [
                'id' => $record['id'] . '-meta-' . $i,
                'tipo' => 'meta',
                'descripcion' => trim($meta)
            ];
        }

        return $items;
    }

    public function findByFilters($params = [])
    {
        $conditions = [];
        $values = [];

        if (!empty($params['fechaInicio'])) {
            $conditions[] = "o.inicio >= ?";
            $values[] = $params['fechaInicio'];
        }
        if (!empty($params['fechaFin'])) {
            $conditions[] = "o.fin <= ?";
            $values[] = $params['fechaFin'];
        }
        if (!empty($params['granja'])) {
            $conditions[] = "o.granja = ?";
            $values[] = $params['granja'];
        }
        if (!empty($params['estado'])) {
            $conditions[] = "o.estado = ?";
            $values[] = $params['estado'];
        }

        $whereClause = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $query = "
            SELECT 
                o.id,
                o.piloto,
                o.granja,
                o.galpon,
                o.objetivo,
                o.meta,
                o.inicio,
                o.fin,
                o.estado,
                (SELECT COUNT(*) FROM proy_subprocesos s WHERE s.id_objetivo = o.id) as total_tareas,
                (SELECT COUNT(*) FROM proy_subprocesos s WHERE s.id_objetivo = o.id AND s.estado_completado_pendiente = 'Completado') as tareas_completadas
            FROM proy_ctrl_objetivos o
            $whereClause
            ORDER BY o.inicio DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($values);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function generateUuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
