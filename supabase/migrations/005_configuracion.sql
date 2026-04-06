-- =============================================
-- MIGRACIÓN 005: Tabla configuracion + tarifa
-- =============================================

CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar o actualizar tarifa a S/ 4.00
INSERT INTO configuracion (clave, valor, updated_at)
VALUES ('tarifa_mensual', '4.00', NOW())
ON CONFLICT (clave) DO UPDATE SET valor = '4.00', updated_at = NOW();

-- RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer configuración
CREATE POLICY "configuracion_select_all"
ON configuracion FOR SELECT
USING (true);

-- Solo Admin modifica configuración
CREATE POLICY "configuracion_update_admin"
ON configuracion FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);
