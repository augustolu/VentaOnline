# CLIENT_BRIEF.md — Formulario de Onboarding de Cliente

> **Instrucciones**: Completá cada sección con la información del cliente.
> Una vez lleno, este archivo se fusiona con `FUNCTIONALITY_MAP.md` y `tenantConfig.json`
> para generar un **único prompt** que re-skinee toda la aplicación.
>
> Las secciones marcadas con ⚠️ son obligatorias. Las marcadas con 💡 son opcionales.

---

## ⚠️ 1. IDENTIDAD DE MARCA

```
Nombre del negocio    : ___
Slogan / tagline      : ___
Rubro / industria     : ___ (ej: celulares, indumentaria, ferretería, alimentos)
Público objetivo      : ___ (ej: técnicos, consumidor final, mayoristas B2B)
Tono de comunicación  : ___ (ej: profesional, informal/juvenil, premium/lujo)
```

## ⚠️ 2. CONTACTO Y REDES

```
Teléfono              : ___
Email de contacto     : ___
WhatsApp (con código) : ___
Instagram             : ___
Facebook              : ___
Dirección física      : ___ (o "sin local físico")
Horario de atención   : ___
```

## ⚠️ 3. PALETA DE COLORES

> Si el cliente no tiene colores definidos, describir la estética deseada
> (ej: "moderno y oscuro", "limpio y minimalista", "vibrante y colorido").

```
Color principal (hex o descripción)     : ___
Color secundario (hex o descripción)    : ___
Color de acento / CTA (hex o desc.)     : ___
Preferencia de modo                     : ___ (claro / oscuro / ambos)
Estética general                        : ___ (ej: glassmorphism, flat, neumorphism, corporativo)
```

## ⚠️ 4. LOGOTIPOS E IMÁGENES

```
¿Tiene logo?                            : ___ (sí/no)
Ruta o URL del logo claro (fondo osc.)  : ___
Ruta o URL del logo oscuro (fondo cla.) : ___
Ruta o URL del favicon                  : ___
¿Tiene imágenes hero / banners?         : ___ (sí/no, adjuntar si tiene)
```

## ⚠️ 5. TIPOGRAFÍA

> Si no tiene preferencia, dejar en blanco y se elegirá una apropiada al rubro.

```
Fuente para títulos    : ___ (ej: Montserrat, Playfair Display, Outfit)
Fuente para cuerpo     : ___ (ej: Inter, Roboto, Open Sans)
Google Fonts URL       : ___ (se genera automáticamente si se eligen las fuentes)
```

## ⚠️ 6. FUNCIONALIDADES ACTIVAS

> Marcar con [x] las que el cliente necesita. Esto controla qué secciones se muestran.

```
[ ] Catálogo de productos (siempre activo)
[ ] Carrito de compras y checkout online
[ ] Favoritos / Wishlist
[ ] Sección Mayorista (precios diferenciados, solicitud de cuenta)
[ ] Gestión de pedidos (panel admin)
[ ] Ventas físicas en mostrador (registro desde panel admin)
[ ] Autocompletado por IA (descripción automática de productos)
[ ] Carga masiva de productos (CSV/Excel)
[ ] Comprobantes de pago / transferencia
[ ] Newsletter
```

## 💡 7. ESTRUCTURA DE NAVEGACIÓN

> Describir qué links quiere en el menú principal. Si no responde, se usan los por defecto.

```
Link 1 : ___ → ___ (ej: "Inicio" → "/")
Link 2 : ___ → ___
Link 3 : ___ → ___
Link 4 : ___ → ___
Link 5 : ___ → ___
```

## 💡 8. CATEGORÍAS DE PRODUCTOS

> Listar las categorías que maneja el cliente.

```
Categoría 1 : ___
Categoría 2 : ___
Categoría 3 : ___
Categoría 4 : ___
Categoría 5 : ___
Categoría 6 : ___
(agregar más si es necesario)
```

## 💡 9. CONTENIDO DEL HERO / BANNER

```
Título principal       : ___ (ej: "Los mejores precios en tecnología")
Subtítulo              : ___ (ej: "Envíos a todo el país")
Texto del botón CTA    : ___ (ej: "Ver Catálogo", "Comprar Ahora")
URL del botón CTA      : ___ (ej: "#productos")
```

## 💡 10. TEXTOS DEL FOOTER

```
Descripción corta del negocio  : ___
Texto de copyright             : ___ (ej: "© 2025 MiNegocio. Todos los derechos reservados.")
Links adicionales del footer   : ___ (ej: Términos, Privacidad, Blog)
```

## 💡 11. METADATA Y SEO

```
Título de la pestaña del navegador : ___ (ej: "MiTienda — Tecnología al mejor precio")
Meta description para Google       : ___
Idioma del sitio                   : ___ (es / en / pt)
```

## 💡 12. NOTAS ADICIONALES DEL CLIENTE

> Cualquier detalle extra, pedidos especiales, integraciones, o preferencias
> que no encajen en las secciones anteriores.

```
___
___
___
```

## ⚠️ 13. CREDENCIALES Y API KEYS

> Cada despliegue necesita sus propias credenciales.
> Estas claves se escriben en `.env` y `.env.local` (nunca se suben a Git).

| # | Servicio | Variable de Entorno | ¿Dónde obtenerla? | Valor |
|---|----------|--------------------|--------------------|-------|
| 1 | **PostgreSQL (Supabase/Neon)** | `DATABASE_URL` | Panel de Supabase → Settings → Database → Connection String (Pooling) | `___` |
| 2 | **PostgreSQL (Directa)** | `DIRECT_URL` | Panel de Supabase → Settings → Database → Connection String (Direct) | `___` |
| 3 | **Google Gemini AI** | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Crear API Key | `___` |
| 4 | **JWT Secret** | `JWT_SECRET` | Clave inventada, mínimo 32 caracteres, única por cliente | `___` |
| 5 | **Mercado Pago** *(opcional)* | `MP_ACCESS_TOKEN` | Panel de Mercado Pago → Integraciones → Credenciales | `___` |
| 6 | **AWS S3** *(opcional, prod)* | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Consola AWS → IAM → Users → Security Credentials | `___` |

> **Nota**: Si el campo de IA (sección 6) está desactivado, no se necesita `GEMINI_API_KEY`.
> Si no usa Mercado Pago, no se necesita `MP_ACCESS_TOKEN`.

---

## 🤖 INSTRUCCIONES PARA EL AGENTE (NO COMPLETAR — SE EJECUTA AUTOMÁTICAMENTE)

> Cuando el usuario diga **"leé CLIENT_BRIEF.md y ejecutalo"** (o similar),
> el agente debe seguir estos pasos exactos:

### Paso 1 — Leer contexto
Leer los siguientes archivos del proyecto para entender la estructura actual:
- `CLIENT_BRIEF.md` (este archivo, ya completado con datos del cliente)
- `FUNCTIONALITY_MAP.md` (mapa de rutas, stores, módulos y componentes)
- `src/config/tenantConfig.json` (configuración actual del theme)

### Paso 2 — Generar configuración
Con los datos de las secciones 1-12, generar y sobreescribir:
- **`src/config/tenantConfig.json`** — nuevo JSON con brand, theme, fonts, features y metadata del cliente

### Paso 3 — Generar archivos de entorno
Con los datos de la sección 13, generar y sobreescribir:
- **`.env`** — con `DATABASE_URL`, `DIRECT_URL` y `GEMINI_API_KEY`
- **`.env.local`** — con `DATABASE_URL`, `DIRECT_URL`, `API_PORT`, `APP_BASE_URL`, `JWT_SECRET`, y las credenciales opcionales

### Paso 4 — Re-skinear componentes UI
Reescribir los siguientes archivos con la nueva identidad visual:
- **`src/components/Header.jsx`** — nuevo diseño, MISMOS imports de stores (useAuthStore, useCartStore, useFavoritesStore, useSearchStore)
- **`src/components/Footer.jsx`** — nuevo diseño con los datos de contacto y redes del cliente
- **`src/app/page.jsx`** — nueva home (hero, categorías, catálogo) con la estética del cliente, MISMAS llamadas fetch a las APIs de productos

### Paso 5 — Actualizar CSS
Actualizar las variables CSS en `src/app/globals.css` con los nuevos colores del theme.

### Paso 6 — Verificar
Abrir `http://localhost:3000/` en el navegador y confirmar que todo renderiza correctamente.

### ⛔ RESTRICCIONES ABSOLUTAS
- **NO TOCAR**: stores de Zustand, services de Prisma, controllers, routes, validators ni middlewares
- **NO CAMBIAR** las firmas de funciones de los stores ni las URLs de las APIs
- Usar **SOLO clases de Tailwind CSS** con los tokens del theme (`bg-primary`, `text-secondary`, etc.)
- Los componentes que son `"use client"` deben seguir siéndolo
- Mantener **todos los imports de stores y todas las llamadas a fetch/API** que ya existen
- El diseño debe ser **premium y moderno** (no genérico/básico)

