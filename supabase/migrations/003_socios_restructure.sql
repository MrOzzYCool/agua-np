-- =============================================
-- MIGRACIÓN 003: Reestructurar tabla socios
-- =============================================

-- Agregar campo registrado_por (auditoría de quién registró)
ALTER TABLE socios ADD COLUMN IF NOT EXISTS registrado_por UUID REFERENCES profiles(id);

-- Agregar campos si no existen (compatibilidad)
ALTER TABLE socios ADD COLUMN IF NOT EXISTS nombres TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS apellidos TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS celular VARCHAR(9);
ALTER TABLE socios ADD COLUMN IF NOT EXISTS zona TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS manzana TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS lote TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS comite TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activo';
ALTER TABLE socios ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE socios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Si nombre_completo existe como columna normal, poblar nombres/apellidos
-- (para datos existentes donde nombre_completo ya tiene valor)
UPDATE socios
SET nombres = COALESCE(nombres, nombre_completo),
    apellidos = COALESCE(apellidos, '')
WHERE nombres IS NULL AND nombre_completo IS NOT NULL;

-- Agregar CHECK constraint para estado si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'socios_estado_check'
    ) THEN
        ALTER TABLE socios ADD CONSTRAINT socios_estado_check CHECK (estado IN ('activo', 'inactivo'));
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_socios_dni ON socios(dni);
CREATE INDEX IF NOT EXISTS idx_socios_estado ON socios(estado);

-- RLS para socios
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para formulario público de pago por DNI)
CREATE POLICY "socios_select_public"
ON socios FOR SELECT
USING (true);

-- Técnico y Admin crean socios
CREATE POLICY "socios_insert_tecnico_admin"
ON socios FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('tecnico', 'administrador'))
);

-- Admin modifica socios
CREATE POLICY "socios_update_admin"
ON socios FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);
