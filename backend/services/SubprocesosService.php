<?php
require_once __DIR__ . '/../repositories/SubprocesosRepository.php';

class SubprocesosService
{
    private $repo;

    public function __construct($db)
    {
        $this->repo = new SubprocesosRepository($db);
    }

    public function getAll()
    {
        return $this->repo->findAll();
    }

    public function getByObjetivo($idObjetivo)
    {
        return $this->repo->findByObjetivo($idObjetivo);
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

    public function countAll()
    {
        return $this->repo->countAll();
    }
}
