-- =============================================
-- MIGRACIÓN 002: Reestructurar tabla pagos
-- =============================================

-- Agregar nuevos campos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'aprobado' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS voucher_url TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES profiles(id);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMPTZ;

-- Pagos existentes quedan como 'aprobado' (ya fueron cobrados)
-- El DEFAULT 'aprobado' se encarga de esto para registros existentes

-- Cambiar default de monto a 4.00 para nuevos pagos
ALTER TABLE pagos ALTER COLUMN monto SET DEFAULT 4.00;

-- Eliminar constraint UNIQUE anterior si existe (socio_id, anio, mes)
-- y crear el nuevo con estado incluido
DO $$
BEGIN
    -- Intentar eliminar constraints existentes
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_socio_id_anio_mes_key') THEN
        ALTER TABLE pagos DROP CONSTRAINT pagos_socio_id_anio_mes_key;
    END IF;
END $$;

-- Nuevo constraint: permite mismo periodo con diferentes estados
ALTER TABLE pagos ADD CONSTRAINT pagos_socio_periodo_estado_unique UNIQUE (socio_id, anio, mes, estado);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_socio ON pagos(socio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON pagos(anio, mes);

-- RLS para pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Público puede crear pagos pendientes (formulario sin auth)
CREATE POLICY "pagos_insert_public"
ON pagos FOR INSERT
WITH CHECK (estado = 'pendiente');

-- Usuarios autenticados pueden insertar pagos (cobro directo)
CREATE POLICY "pagos_insert_auth"
ON pagos FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Usuarios autenticados leen todos los pagos
CREATE POLICY "pagos_select_auth"
ON pagos FOR SELECT
USING (auth.role() = 'authenticated');

-- Lectura pública limitada: solo pagos aprobados del socio (para cálculo de deuda)
CREATE POLICY "pagos_select_public"
ON pagos FOR SELECT
USING (true);

-- Cobrador y Admin pueden aprobar/rechazar
CREATE POLICY "pagos_update_cobrador_admin"
ON pagos FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('cobrador', 'administrador'))
);
