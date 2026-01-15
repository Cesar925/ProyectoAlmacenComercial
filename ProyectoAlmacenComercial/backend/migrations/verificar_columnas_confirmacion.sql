-- Script de verificación y creación de columnas para confirmación de objetivos
-- Ejecutar en MySQL/phpMyAdmin

-- 1. Verificar si la tabla existe
SELECT 'Verificando tabla proy_ctrl_objetivos...' AS paso;
SHOW TABLES LIKE 'proy_ctrl_objetivos';

-- 2. Ver estructura actual de la tabla
SELECT 'Estructura actual de la tabla:' AS paso;
DESCRIBE proy_ctrl_objetivos;

-- 3. Verificar si las columnas nuevas ya existen
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'proy_ctrl_objetivos'
  AND COLUMN_NAME IN ('fecha_fin_real', 'presupuesto_ejecutado', 'observaciones_cierre');

-- 4. Si las columnas NO existen, ejecutar este ALTER TABLE:
-- (Descomenta las siguientes líneas si necesitas crear las columnas)

/*
ALTER TABLE proy_ctrl_objetivos
ADD COLUMN fecha_fin_real DATE NULL AFTER fin,
ADD COLUMN presupuesto_ejecutado DECIMAL(12,2) DEFAULT 0.00 AFTER fecha_fin_real,
ADD COLUMN observaciones_cierre TEXT NULL AFTER presupuesto_ejecutado;
*/

-- 5. Verificar datos de prueba
SELECT 'Registros existentes:' AS paso;
SELECT 
    id,
    piloto,
    objetivo,
    estado,
    inicio,
    fin,
    fecha_fin_real,
    presupuesto_ejecutado,
    observaciones_cierre
FROM proy_ctrl_objetivos
LIMIT 5;

-- 6. Contar registros por estado
SELECT 'Resumen por estado:' AS paso;
SELECT 
    estado,
    COUNT(*) as total,
    SUM(presupuesto_ejecutado) as presupuesto_total
FROM proy_ctrl_objetivos
GROUP BY estado;
