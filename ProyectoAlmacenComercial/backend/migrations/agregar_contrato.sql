-- Agregar columna contrato a proy_ctrl_objetivos
ALTER TABLE proy_ctrl_objetivos ADD COLUMN contrato VARCHAR(255) DEFAULT NULL;
