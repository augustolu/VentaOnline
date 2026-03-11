# CREDENCIALES DE PRODUCCIÓN - E-COMMERCE
**IMPORTANTE:** Entregar este documento de forma segura al dueño del sistema. Si los valores cambian en el futuro, deberán actualizarse en las variables de entorno (`.env` y `.env.local`) del servidor donde se aloje la web.

## 🤖 Google Gemini (Inteligencia Artificial)
Llave maestra para el motor de autocompletado de productos e importador masivo (Modelo: Gemini 2.5 Flash Lite).
**API Key:** `AIzaSyD6CPSoSfw1N-pEjLfAtL2vs_heXkQuJ3w`

---

## 🗄️ Supabase (Base de Datos en la Nube)
Credenciales del cluster de PostgreSQL alojado en AWS (São Paulo).

**URL con Pooling (Para Prisma Client / conexiones repetitivas):**
`postgresql://postgres.mprvnxvywdrihauzriok:Augusto10020302!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true`

**URL Directa (Para migraciones `prisma db push` / conexiones administrativas):**
`postgresql://postgres.mprvnxvywdrihauzriok:Augusto10020302!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`

---

## 🔑 JWT Secret (Seguridad de Sesiones)
Firma criptográfica utilizada para validar los inicios de sesión de los administradores y clientes. Si este valor se pierde o cambia, todos los usuarios conectados actualmentes serán cerrados por seguridad.
**Secret Key:** `ecommerce_sanluis_jwt_secret_key_2026_super_seguro`
