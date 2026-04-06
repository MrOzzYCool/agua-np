-- =============================================
-- MIGRACIÓN 008: Pago único por transacción
-- Agregar campo periodos (JSONB array) y monto_total
-- Un solo registro por transacción en vez de uno por mes
-- =============================================

ALTER TABLE pagos ADD COLUMN IF NOT EXISTS periodos JSONB;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_total NUMERIC(10,2);

-- Para pagos existentes que tienen anio/mes individual,
-- poblar periodos como array de un solo elemento
UPDATE pagos
SET periodos = jsonb_build_array(jsonb_build_object('anio', anio, 'mes', mes)),
    monto_total = monto
WHERE periodos IS NULL AND anio IS NOT NULL;
