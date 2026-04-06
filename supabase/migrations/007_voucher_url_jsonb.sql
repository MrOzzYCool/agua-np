-- =============================================
-- MIGRACIÓN 007: Cambiar voucher_url a JSONB
-- =============================================

-- Convertir datos existentes de TEXT a JSONB
-- Si ya tiene URLs separadas por coma, las convierte a array JSON
ALTER TABLE pagos ALTER COLUMN voucher_url TYPE JSONB
  USING CASE
    WHEN voucher_url IS NULL THEN NULL
    WHEN voucher_url LIKE '[%' THEN voucher_url::jsonb
    WHEN voucher_url LIKE '%,%' THEN to_jsonb(string_to_array(voucher_url, ','))
    ELSE to_jsonb(ARRAY[voucher_url])
  END;

-- Comentario: voucher_url ahora almacena un array JSON de URLs
-- Ejemplo: ["https://...url1.jpg", "https://...url2.pdf"]
