# Guía de Inicialización del Proyecto (SaaS White-Label)

Bienvenido a la guía maestra de configuración. Este documento es la referencia principal para cualquier desarrollador (humano o IA) que interactúe con este proyecto de arquitectura modular.

---

## 🛠 Stack Tecnológico

- **Frontend:** Next.js (React)
- **Backend:** Node.js con Express
- **Base de Datos:** PostgreSQL (con Prisma ORM)
- **Estilos:** Tailwind CSS

---

## 📋 Prerrequisitos

Para ejecutar este proyecto localmente, necesitas tener instalado:

- **Node.js**: v18.0.0 o superior (Recomendado versión LTS).
- **Gestor de paquetes**: `npm` (incluido con Node.js).
- **Git**: Para el control de versiones local o remoto.
- **Base de Datos**: Instancia de PostgreSQL activa (o un servicio como Supabase/Neon).

---

## 🚀 Pasos de Instalación

Sigue estrictamente estos pasos para levantar el entorno de desarrollo:

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_DIRECTORIO>
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea/Configura los archivos `.env` y `.env.local` en la raíz del proyecto guiándote por la sección de Variables de Entorno de este documento.

4. **Preparar la Base de Datos (Prisma):**
   Genera el cliente de Prisma para que el ORM reconozca tu esquema:
   ```bash
   npx prisma generate
   ```
   *(Nota: Si la base de datos está vacía y en desarrollo, deberás ejecutar `npx prisma db push` o ejecutar tus scripts de seed).*

5. **Levantar el entorno de desarrollo (Full-Stack):**
   ```bash
   npm run dev:all
   ```
   El frontend estará disponible en `http://localhost:3000` y el backend en `http://localhost:3001`.

---

## 🔐 Variables de Entorno (.env / .env.local)

El sistema requiere configuraciones específicas para operar. Asegúrate de definir las siguientes variables:

**Archivo `.env` (Principalmente para herramientas CLI como Prisma):**
```env
# URL de conexión (Pooling) de Postgres (Ej. Supabase)
DATABASE_URL="postgresql://usuario:password@host:5432/postgres?pgbouncer=true"

# URL de conexión directa a Postgres (sin pooling) para migraciones/esquema
DIRECT_URL="postgresql://usuario:password@host:5432/postgres"

# Clave de API para integraciones de inteligencia artificial (Gemini)
GEMINI_API_KEY="tu_clave_api_aqui"
```

**Archivo `.env.local` (Leído por Next.js y el servidor Express):**
```env
# (Opcional) Puerto para la API de Express (Evita colisión con Next.js puerto 3000)
API_PORT=3001

# URL base del frontend, utilizada para configurar reglas de CORS en Express
APP_BASE_URL="http://localhost:3000"

# Secretos de autenticación (Variables del negocio)
JWT_SECRET="tu_secreto_seguro_para_jwt"

# Variables de Pasarelas de Pago o Storage
# MP_ACCESS_TOKEN="credencial_mercado_pago_..."
```

---

## 📁 Estructura de Carpetas

La arquitectura está diseñada para separar la lógica `core` del motor SaaS (Backend) y la capa de presentación White-Label (Frontend).

```text
/
├── prisma/                 # Esquema y configuración de la Base de Datos.
├── public/                 # Activos estáticos de Next.js.
├── uploads/                # Archivos locales, como comprobantes e imágenes subidas.
│
├── scripts/                # Tareas de mantenimiento, utilidades y scrapers.
│
├── src/
│   ├── app/                # Frontend: Vistas y rutas de Next.js (Visual/Modificable).
│   ├── components/         # Frontend: Componentes UI de React, Modales, etc (Visual).
│   ├── lib/                # Frontend/Backend: Utilidades compartidas e instancias (ej. prisma.js, store).
│   │
│   ├── modules/            # Backend: CORE LÓGICO Y DE NEGOCIO (Express).
│   │   ├── auth/           # Rutas y controladores de Autenticación.
│   │   ├── checkout/       # Lógica del Carrito y Caja de la tienda.
│   │   ├── payments/       # Integración financiera y comprobantes.
│   │   ├── products/       # Gestión del catálogo, stock e inventario.
│   │   ├── upload/         # Procesamiento de subida de archivos (Multer).
│   │   └── users/          # Gestión de cuentas, membresías y roles (RBAC).
│   │
│   └── server.js           # Backend: Entry point de la API Express.
│
└── package.json            # Dependencias y manifiesto de scripts.
```

**Directriz Arquitectónica "White-Label":**
- Toda la lógica gráfica, de branding corporativo y experiencia de usuario (UI) reside dentro de `src/app` y `src/components`. Esta área debe ser sumamente maleable.
- Toda la lógica dura de negocio, validaciones transaccionales, auditoría y control de modelos radican exclusivamente en `src/modules` y están servidos a través de la API en local/remoto.

---

## 💻 Protocolo de Comandos

| Comando de Terminal | Descripción y Caso de Uso |
| :--- | :--- |
| `npm install` | Instala (o reinstala) todas las dependencias del `package.json`. |
| `npm run dev:all` | **(Principal)** Inicia simultáneamente Frontend (Next.js) y Backend (Express). |
| `npm run dev` | Inicia **exclusivamente** el servidor Frontend (Next.js) en puerto 3000. |
| `npm run api:dev` | Inicia **exclusivamente** el servidor Backend de Express en modo watch (puerto 3001). |
| `npx prisma generate` | Regenera y compila el Cliente Prisma. Indispensable tras tocar `schema.prisma`. |
| `npm run build` | Compila y optimiza Frontend/Servidor de Next.js para entornos de producción. |
| `npm run start` | Levanta el servidor producción previamente generado con el comando build. |
| `npm run setup:admin` | Ejecuta el script administrativo para generar un seed base o configuración inicial. |

---
*Este documento establece los pilares de la infraestructura del proyecto. Consultar antes de realizar refactorizaciones mayores en la jerarquía del código.*
