-- =============================================
-- MIGRACIÓN 006: Bucket de Storage para vouchers
-- =============================================

-- Crear bucket (ejecutar desde Supabase Dashboard si no funciona via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'vouchers',
    'vouchers',
    false,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede subir archivos (formulario público)
CREATE POLICY "vouchers_insert_public"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vouchers');

-- Política: usuarios autenticados pueden leer vouchers
CREATE POLICY "vouchers_select_auth"
ON storage.objects FOR SELECT
USING (bucket_id = 'vouchers' AND auth.role() = 'authenticated');
