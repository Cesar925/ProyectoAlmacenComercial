<?php

class UsuarioRepository {

    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function login($usuario, $password) {
        $sql = "SELECT u.codigo, u.nombre, u.rol
                FROM usuario u
                JOIN conempre c ON c.epre = 'RS'
                WHERE u.codigo = ?
                AND u.password = LEFT(AES_ENCRYPT(?, c.enom), 8)";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(1, $usuario, PDO::PARAM_STR);
        $stmt->bindParam(2, $password, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
