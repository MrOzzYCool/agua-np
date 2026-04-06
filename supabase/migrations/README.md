# Migraciones SQL — Reestructuración YAKU

Ejecutar en orden desde el **SQL Editor** de Supabase Dashboard:

1. `001_profiles.sql` — Tabla profiles + trigger auto-creación
2. `002_pagos_restructure.sql` — Campos estado/voucher/aprobación en pagos + RLS
3. `003_socios_restructure.sql` — Campo registrado_por + RLS en socios
4. `004_historial_auditoria.sql` — Tabla de auditoría + RLS
5. `005_configuracion.sql` — Tarifa S/ 4.00 + RLS
6. `006_storage_vouchers.sql` — Bucket vouchers (5MB, JPG/PNG/PDF)

## Notas
- Los pagos existentes quedan con estado `aprobado` (ya fueron cobrados).
- La tarifa S/ 4.00 aplica solo para pagos futuros.
- El bucket `vouchers` puede necesitar crearse manualmente desde Storage en el Dashboard si el INSERT falla.
