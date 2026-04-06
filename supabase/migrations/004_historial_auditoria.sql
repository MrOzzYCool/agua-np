-- =============================================
-- MIGRACIÓN 004: Tabla historial_auditoria
-- =============================================

CREATE TABLE IF NOT EXISTS historial_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_accion TEXT NOT NULL CHECK (tipo_accion IN (
        'registro_socio', 'envio_pago', 'aprobacion_pago',
        'rechazo_pago', 'cambio_estado_socio'
    )),
    usuario_id UUID REFERENCES profiles(id),
    usuario_nombre TEXT NOT NULL DEFAULT 'Socio',
    entidad_tipo TEXT NOT NULL CHECK (entidad_tipo IN ('socio', 'pago')),
    entidad_id UUID NOT NULL,
    observaciones TEXT,
    estado_resultante TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON historial_auditoria(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON historial_auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON historial_auditoria(usuario_id);

-- RLS
ALTER TABLE historial_auditoria ENABLE ROW LEVEL SECURITY;

-- Admin y Cobrador leen auditoría
CREATE POLICY "auditoria_select_admin_cobrador"
ON historial_auditoria FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('administrador', 'cobrador'))
);

-- Sistema inserta (cualquier autenticado o anon para pagos públicos)
CREATE POLICY "auditoria_insert_all"
ON historial_auditoria FOR INSERT
WITH CHECK (true);
