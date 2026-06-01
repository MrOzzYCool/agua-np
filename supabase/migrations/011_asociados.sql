-- =============================================
-- MIGRACIÓN 011: Tabla asociados
-- Módulo de Inscripción de Asociados
-- Similar a socios pero con numero_asociado
-- =============================================

CREATE TABLE IF NOT EXISTS asociados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_asociado TEXT,                          -- Ingresado manualmente por ahora
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    nombre_completo TEXT GENERATED ALWAYS AS (apellidos || ' ' || nombres) STORED,
    dni VARCHAR(8) NOT NULL UNIQUE,
    celular VARCHAR(9),
    zona TEXT NOT NULL,
    manzana TEXT NOT NULL,
    lote TEXT NOT NULL,
    comite TEXT NOT NULL,
    direccion TEXT GENERATED ALWAYS AS (zona || ' - MZ ' || manzana || ' - LOTE ' || lote || ' - COMITÉ ' || comite) STORED,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    registrado_por UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asociados_dni ON asociados(dni);
CREATE INDEX IF NOT EXISTS idx_asociados_estado ON asociados(estado);
CREATE INDEX IF NOT EXISTS idx_asociados_numero ON asociados(numero_asociado);

-- RLS
ALTER TABLE asociados ENABLE ROW LEVEL SECURITY;

-- Lectura: autenticados
CREATE POLICY "asociados_select_auth"
ON asociados FOR SELECT
USING (auth.role() = 'authenticated');

-- Inserción: autenticados
CREATE POLICY "asociados_insert_auth"
ON asociados FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Actualización: autenticados
CREATE POLICY "asociados_update_auth"
ON asociados FOR UPDATE
USING (auth.role() = 'authenticated');
