-- =============================================
-- MIGRACIÓN 010: Roles por subsistema (JSONB)
-- Añade columna roles JSONB a profiles para
-- permisos granulares por subsistema.
-- Compatible con el campo rol existente.
-- =============================================

-- Agregar columna JSONB roles (default vacío)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '{}'::jsonb;

-- Migrar el rol actual a roles->'yaku' para compatibilidad
UPDATE profiles
SET roles = jsonb_set(COALESCE(roles, '{}'::jsonb), '{yaku}', to_jsonb(rol::text))
WHERE rol IS NOT NULL AND (roles IS NULL OR NOT roles ? 'yaku');

-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING gin (roles);
