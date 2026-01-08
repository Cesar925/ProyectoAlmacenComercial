<?php
class Database {
    /*private $host = "localhost";
    private $db_name = "comtrol_procesos";
    private $username = "root";
    private $password = "";
    private $conn;*/

private $host = "200.48.160.2";
    private $db_name = "grs_proyjoya";
    private $username = "rinconada";
    private $password = "MrCls078e5ou";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->db_name};charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
        }
        return $this->conn;
    }
}

?>
