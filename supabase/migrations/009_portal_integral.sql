-- =============================================
-- MIGRACIÓN 009: Portal Integral — Cementerio + Alquileres
-- Módulos nuevos: cementerio_nichos, cementerio_ventas,
--   cementerio_cuotas, instalaciones, reservas
-- Trigger de solapamiento, RLS, y ampliación de auditoría
-- =============================================


-- =============================================
-- 1.1 NUEVAS TABLAS
-- =============================================

-- ----- cementerio_nichos -----
CREATE TABLE IF NOT EXISTS cementerio_nichos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ubicacion TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK (tipo IN ('nicho', 'mausoleo')),
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'vendido', 'reservado')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nichos_estado ON cementerio_nichos(estado);
CREATE INDEX IF NOT EXISTS idx_nichos_tipo ON cementerio_nichos(tipo);


-- ----- cementerio_ventas -----
CREATE TABLE IF NOT EXISTS cementerio_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nicho_id UUID NOT NULL REFERENCES cementerio_nichos(id) ON DELETE RESTRICT,
    socio_id UUID NOT NULL REFERENCES socios(id) ON DELETE RESTRICT,
    precio_total NUMERIC(10,2) NOT NULL CHECK (precio_total > 0),
    numero_cuotas INT NOT NULL CHECK (numero_cuotas >= 1),
    monto_cuota NUMERIC(10,2) NOT NULL CHECK (monto_cuota > 0),
    fecha_contrato DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada')),
    observaciones TEXT,
    registrado_por UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ventas_socio ON cementerio_ventas(socio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_nicho ON cementerio_ventas(nicho_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON cementerio_ventas(estado);


-- ----- cementerio_cuotas -----
CREATE TABLE IF NOT EXISTS cementerio_cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES cementerio_ventas(id) ON DELETE RESTRICT,
    numero_cuota INT NOT NULL CHECK (numero_cuota >= 1),
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    fecha_vencimiento DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pago_en_revision', 'pagado')),
    voucher_url TEXT,
    observaciones TEXT,
    aprobado_por UUID REFERENCES profiles(id),
    fecha_aprobacion TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(venta_id, numero_cuota)
);

CREATE INDEX IF NOT EXISTS idx_cuotas_venta ON cementerio_cuotas(venta_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cementerio_cuotas(estado);


-- ----- instalaciones -----
CREATE TABLE IF NOT EXISTS instalaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    tarifa_hora NUMERIC(10,2) NOT NULL CHECK (tarifa_hora >= 0),
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO instalaciones (nombre, descripcion, tarifa_hora)
VALUES
  ('Estadio', 'Estadio comunitario de la asociación', 50.00),
  ('Losa Deportiva', 'Losa deportiva multiusos', 30.00)
ON CONFLICT (nombre) DO NOTHING;


-- ----- reservas -----
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instalacion_id UUID NOT NULL REFERENCES instalaciones(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    socio_id UUID REFERENCES socios(id),
    nombre_externo TEXT,
    telefono_externo VARCHAR(9),
    monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
    estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado')),
    estado_reserva TEXT NOT NULL DEFAULT 'activa' CHECK (estado_reserva IN ('activa', 'cancelada')),
    voucher_url TEXT,
    observaciones TEXT,
    registrado_por UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Al menos un arrendatario debe estar presente
    CONSTRAINT reserva_arrendatario_check CHECK (socio_id IS NOT NULL OR nombre_externo IS NOT NULL),
    -- hora_fin debe ser posterior a hora_inicio
    CONSTRAINT reserva_horario_check CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_reservas_instalacion ON reservas(instalacion_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_estado_reserva ON reservas(estado_reserva);
CREATE INDEX IF NOT EXISTS idx_reservas_estado_pago ON reservas(estado_pago);


-- =============================================
-- 1.2 TRIGGER DE DETECCIÓN DE SOLAPAMIENTO
-- =============================================

-- Función que verifica solapamiento de horarios antes de INSERT/UPDATE en reservas
CREATE OR REPLACE FUNCTION fn_check_reserva_overlap()
RETURNS TRIGGER AS $$
DECLARE
    conflicto RECORD;
BEGIN
    -- Solo verificar si la reserva está activa
    IF NEW.estado_reserva = 'cancelada' THEN
        RETURN NEW;
    END IF;

    SELECT id, hora_inicio, hora_fin
    INTO conflicto
    FROM reservas
    WHERE instalacion_id = NEW.instalacion_id
      AND fecha = NEW.fecha
      AND estado_reserva = 'activa'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND hora_inicio < NEW.hora_fin
      AND hora_fin > NEW.hora_inicio
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Conflicto de horario: ya existe una reserva activa de % a % para esta instalación en la fecha %',
            conflicto.hora_inicio, conflicto.hora_fin, NEW.fecha;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reserva_overlap
    BEFORE INSERT OR UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_reserva_overlap();


-- =============================================
-- 1.3 POLÍTICAS RLS PARA NUEVAS TABLAS
-- =============================================

-- ----- RLS: cementerio_nichos -----
ALTER TABLE cementerio_nichos ENABLE ROW LEVEL SECURITY;

-- Lectura pública (formulario /pagar necesita consultar parcelas de ventas)
CREATE POLICY "nichos_select_public"
ON cementerio_nichos FOR SELECT
USING (true);

-- Inserción: solo Admin
CREATE POLICY "nichos_insert_admin"
ON cementerio_nichos FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);

-- Actualización: solo Admin
CREATE POLICY "nichos_update_admin"
ON cementerio_nichos FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);


-- ----- RLS: cementerio_ventas -----
ALTER TABLE cementerio_ventas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (formulario /pagar y cobrador necesitan ver ventas)
CREATE POLICY "ventas_select_public"
ON cementerio_ventas FOR SELECT
USING (true);

-- Inserción: solo Admin
CREATE POLICY "ventas_insert_admin"
ON cementerio_ventas FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);

-- Actualización: solo Admin
CREATE POLICY "ventas_update_admin"
ON cementerio_ventas FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);


-- ----- RLS: cementerio_cuotas -----
ALTER TABLE cementerio_cuotas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (formulario /pagar necesita ver cuotas pendientes)
CREATE POLICY "cuotas_select_public"
ON cementerio_cuotas FOR SELECT
USING (true);

-- Inserción pública: pagos desde formulario público
CREATE POLICY "cuotas_insert_public"
ON cementerio_cuotas FOR INSERT
WITH CHECK (true);

-- Actualización: Cobrador y Admin (aprobar/rechazar cuotas)
CREATE POLICY "cuotas_update_cobrador_admin"
ON cementerio_cuotas FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('cobrador', 'administrador'))
);


-- ----- RLS: instalaciones -----
ALTER TABLE instalaciones ENABLE ROW LEVEL SECURITY;

-- Lectura pública (público necesita ver instalaciones para reservas)
CREATE POLICY "instalaciones_select_public"
ON instalaciones FOR SELECT
USING (true);

-- Inserción: solo Admin
CREATE POLICY "instalaciones_insert_admin"
ON instalaciones FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);

-- Actualización: solo Admin
CREATE POLICY "instalaciones_update_admin"
ON instalaciones FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'administrador')
);


-- ----- RLS: reservas -----
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (público necesita ver reservas para pagar)
CREATE POLICY "reservas_select_public"
ON reservas FOR SELECT
USING (true);

-- Inserción: Cobrador y Admin crean reservas desde dashboard
CREATE POLICY "reservas_insert_auth"
ON reservas FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('cobrador', 'administrador'))
);

-- Inserción pública: para pagos de alquiler desde formulario público
CREATE POLICY "reservas_insert_public"
ON reservas FOR INSERT
WITH CHECK (true);

-- Actualización: Cobrador y Admin (aprobar pagos, cancelar reservas)
CREATE POLICY "reservas_update_cobrador_admin"
ON reservas FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol IN ('cobrador', 'administrador'))
);


-- =============================================
-- 1.4 AMPLIACIÓN DE CHECK CONSTRAINTS EN historial_auditoria
-- =============================================

-- Ampliar CHECK de tipo_accion para incluir nuevos tipos
-- (superconjunto de los valores existentes — registros actuales siguen siendo válidos)
ALTER TABLE historial_auditoria DROP CONSTRAINT IF EXISTS historial_auditoria_tipo_accion_check;
ALTER TABLE historial_auditoria ADD CONSTRAINT historial_auditoria_tipo_accion_check
CHECK (tipo_accion IN (
    -- Existentes (agua)
    'registro_socio', 'envio_pago', 'aprobacion_pago',
    'rechazo_pago', 'cambio_estado_socio',
    -- Nuevos (cementerio)
    'venta_cementerio', 'pago_cuota_cementerio',
    'aprobacion_cuota_cementerio', 'rechazo_cuota_cementerio',
    'modificacion_parcela',
    -- Nuevos (alquileres)
    'creacion_reserva', 'cancelacion_reserva',
    'pago_alquiler', 'aprobacion_alquiler', 'rechazo_alquiler',
    'modificacion_instalacion'
));

-- Ampliar CHECK de entidad_tipo para incluir nuevos tipos
ALTER TABLE historial_auditoria DROP CONSTRAINT IF EXISTS historial_auditoria_entidad_tipo_check;
ALTER TABLE historial_auditoria ADD CONSTRAINT historial_auditoria_entidad_tipo_check
CHECK (entidad_tipo IN (
    -- Existentes
    'socio', 'pago',
    -- Nuevos
    'parcela', 'venta_cementerio', 'cuota_cementerio',
    'instalacion', 'reserva'
));
