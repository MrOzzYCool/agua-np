-- ================================================================
-- MIGRACIÓN COMPLETA — REESTRUCTURACIÓN YAKU
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ================================================================

-- =============================================
-- 1. TABLA PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'tecnico'
        CHECK (rol IN ('tecnico', 'cobrador', 'administrador')),
    estado TEXT NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador')
    );

CREATE POLICY "profiles_all_admin" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador')
    );

-- Trigger: crear perfil automáticamente al registrar usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre_completo, rol, estado)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.email),
        COALESCE(NEW.raw_user_meta_data ->> 'rol', 'tecnico'),
        'activo'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. MODIFICAR TABLA SOCIOS
-- =============================================
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS registrado_por UUID REFERENCES public.profiles(id);
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS nombres TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS apellidos TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS celular VARCHAR(9);
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS zona TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS manzana TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS lote TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS comite TEXT;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS fecha_inicio DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Poblar nombres/apellidos desde nombre_completo existente
UPDATE public.socios
SET nombres = COALESCE(nombres, nombre_completo),
    apellidos = COALESCE(apellidos, '')
WHERE nombres IS NULL AND nombre_completo IS NOT NULL;

-- Asegurar estado tiene CHECK constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'socios_estado_check' AND conrelid = 'public.socios'::regclass
    ) THEN
        ALTER TABLE public.socios ADD CONSTRAINT socios_estado_check
            CHECK (estado IN ('activo', 'inactivo'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_socios_dni ON public.socios(dni);
CREATE INDEX IF NOT EXISTS idx_socios_estado ON public.socios(estado);

ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socios_select_public" ON public.socios
    FOR SELECT USING (true);

CREATE POLICY "socios_insert_tecnico_admin" ON public.socios
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('tecnico', 'administrador'))
    );

CREATE POLICY "socios_update_admin" ON public.socios
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador')
    );

-- =============================================
-- 3. MODIFICAR TABLA PAGOS
-- =============================================
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'aprobado'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS voucher_url TEXT;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES public.profiles(id);
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMPTZ;

-- Monto default a 4.00 para nuevos pagos
ALTER TABLE public.pagos ALTER COLUMN monto SET DEFAULT 4.00;

-- Eliminar constraint UNIQUE anterior si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_socio_id_anio_mes_key') THEN
        ALTER TABLE public.pagos DROP CONSTRAINT pagos_socio_id_anio_mes_key;
    END IF;
END $$;

-- Nuevo constraint: permite mismo periodo con diferentes estados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_socio_periodo_estado_unique') THEN
        ALTER TABLE public.pagos ADD CONSTRAINT pagos_socio_periodo_estado_unique
            UNIQUE (socio_id, anio, mes, estado);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_socio ON public.pagos(socio_id);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON public.pagos(anio, mes);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_insert_public" ON public.pagos
    FOR INSERT WITH CHECK (estado = 'pendiente');

CREATE POLICY "pagos_insert_auth" ON public.pagos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "pagos_select_all" ON public.pagos
    FOR SELECT USING (true);

CREATE POLICY "pagos_update_cobrador_admin" ON public.pagos
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('cobrador', 'administrador'))
    );

-- =============================================
-- 4. TABLA HISTORIAL_AUDITORIA
-- =============================================
CREATE TABLE IF NOT EXISTS public.historial_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_accion TEXT NOT NULL CHECK (tipo_accion IN (
        'registro_socio', 'envio_pago', 'aprobacion_pago',
        'rechazo_pago', 'cambio_estado_socio'
    )),
    usuario_id UUID REFERENCES public.profiles(id),
    usuario_nombre TEXT NOT NULL DEFAULT 'Socio',
    entidad_tipo TEXT NOT NULL CHECK (entidad_tipo IN ('socio', 'pago')),
    entidad_id UUID NOT NULL,
    observaciones TEXT,
    estado_resultante TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON public.historial_auditoria(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.historial_auditoria(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.historial_auditoria(usuario_id);

ALTER TABLE public.historial_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_select_admin_cobrador" ON public.historial_auditoria
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol IN ('administrador', 'cobrador'))
    );

CREATE POLICY "auditoria_insert_all" ON public.historial_auditoria
    FOR INSERT WITH CHECK (true);

-- =============================================
-- 5. TABLA CONFIGURACION + TARIFA S/ 4.00
-- =============================================
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.configuracion (clave, valor, updated_at)
VALUES ('tarifa_mensual', '4.00', NOW())
ON CONFLICT (clave) DO UPDATE SET valor = '4.00', updated_at = NOW();

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_select_all" ON public.configuracion
    FOR SELECT USING (true);

CREATE POLICY "configuracion_all_admin" ON public.configuracion
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'administrador')
    );

-- =============================================
-- 6. BUCKET VOUCHERS EN STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vouchers',
    'vouchers',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "vouchers_insert_public" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'vouchers');

CREATE POLICY "vouchers_select_auth" ON storage.objects
    FOR SELECT USING (bucket_id = 'vouchers' AND auth.role() = 'authenticated');

-- =============================================
-- FIN DE MIGRACIÓN
-- =============================================
