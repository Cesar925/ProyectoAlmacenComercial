<?php
require_once __DIR__ . '/../repositories/ControlObjetivosRepository.php';

class ControlObjetivosService
{
    private $repo;

    public function __construct($db)
    {
        $this->repo = new ControlObjetivosRepository($db);
    }

    public function getAll()
    {
        return $this->repo->findAll();
    }

    public function getById($id)
    {
        return $this->repo->findById($id);
    }

    public function save($data)
    {
        return $this->repo->save($data);
    }

    public function update($data)
    {
        return $this->repo->save($data);
    }

    public function delete($id)
    {
        return $this->repo->delete($id);
    }

    public function getFiltered($params = [])
    {
        return $this->repo->findByFilters($params);
    }

    public function countAll()
    {
        return $this->repo->countAll();
    }

    public function getItemsByGrupo($idGrupo)
    {
        return $this->repo->findItemsByGrupo($idGrupo);
    }

    public function getItemById($id)
    {
        return $this->repo->findItemById($id);
    }
}
