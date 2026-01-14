-- Tabla para almacenar rutas de archivos adjuntos a objetivos
CREATE TABLE IF NOT EXISTS proy_objetivo_archivos (
    id_ruta VARCHAR(64) PRIMARY KEY,
    id_objetivo VARCHAR(64) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL
);
