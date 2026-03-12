# FUNCTIONALITY_MAP.md — Mapa de Funcionalidades

> Este documento cataloga todas las rutas, módulos de backend, stores de Zustand y componentes UI del proyecto.
> Sirve como referencia para generar "skins" de HTML distintos que reutilizan las mismas funciones internas.

---

## 1. Rutas Frontend (`src/app/`)

| Ruta | Archivo | Descripción | Feature Flag |
|------|---------|-------------|--------------|
| `/` | `page.jsx` | Home — catálogo de productos, hero, búsqueda | — (core) |
| `/login` | `login/page.jsx` | Formulario de inicio de sesión | — (core) |
| `/register` | `register/page.jsx` | Formulario de registro de usuario | — (core) |
| `/product/[id]` | `product/[id]/page.jsx` | Detalle de producto individual | — (core) |
| `/favorites` | `favorites/page.jsx` | Lista de productos favoritos | `hasFavorites` |
| `/mayorista` | `mayorista/page.jsx` | Página de solicitud / catálogo mayorista | `hasWholesale` |
| `/demo/product-card` | `demo/product-card/page.jsx` | Demo visual de tarjeta de producto | — (dev only) |
| `/dashboard` | `dashboard/page.jsx` | Vista general del panel admin | — (core admin) |
| `/dashboard/products` | `dashboard/products/page.jsx` | CRUD de productos (admin/employee) | — (core admin) |
| `/dashboard/orders` | `dashboard/orders/page.jsx` | Gestión de pedidos | `hasOrderManagement` |
| `/dashboard/users` | `dashboard/users/page.jsx` | Gestión de usuarios y roles | — (core admin) |

---

## 2. Módulos Backend (`src/modules/`)

### 2.1 Auth (`src/modules/auth/`)

| Archivo | Rol |
|---------|-----|
| `auth.routes.js` | Define endpoints: `POST /register`, `POST /login`, `POST /logout`, `GET /me` |
| `auth.controller.js` | Handlers de Express que orquestan el servicio |
| `auth.service.js` | Lógica de negocio: hash de contraseñas, JWT, validación de credenciales (Prisma) |
| `auth.validator.js` | Validación de inputs con Zod |
| `auth.errors.js` | Errores personalizados del módulo |

### 2.2 Products (`src/modules/products/`)

| Archivo | Rol |
|---------|-----|
| `products.routes.js` | CRUD completo: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/stock`, `POST /:id/sale`, `POST /auto-image`, `POST /bulk-delete`, `PATCH /bulk-price` |
| `products.controller.js` | Handlers de Express |
| `products.service.js` | Lógica de negocio: creación, actualización, eliminación, stock y ventas físicas (Prisma) |
| `products.admin.service.js` | Operaciones administrativas masivas (bulk delete, bulk price update) |
| `imageScraper.js` | Scraping de imágenes de producto desde fuentes externas |

### 2.3 Checkout (`src/modules/checkout/`)

| Archivo | Rol |
|---------|-----|
| `checkout.routes.js` | `POST /api/checkout` — procesa carrito y crea orden |
| `checkout.controller.js` | Handler de Express |
| `checkout.service.js` | Lógica: validación de stock, creación de orden con `OrderItem`s, cálculo de totales (Prisma) |
| `checkout.validator.js` | Validación de inputs con Zod |
| `checkout.errors.js` | Errores personalizados |

### 2.4 Payments (`src/modules/payments/`)

| Archivo | Rol |
|---------|-----|
| `payments.routes.js` | `POST /upload-receipt` (cliente sube comprobante), `POST /verify` (admin aprueba/rechaza) |
| `payments.controller.js` | Handlers de Express |
| `payments.service.js` | Lógica: asociación de comprobante a orden, verificación de pago, actualización de estado (Prisma) |
| `payments.validator.js` | Validación con Zod |
| `payments.multer.js` | Configuración de Multer para upload de comprobantes |
| `payments.errors.js` | Errores personalizados |

### 2.5 Users (`src/modules/users/`)

| Archivo | Rol |
|---------|-----|
| `users.routes.js` | `GET /` (listar), `GET /roles`, `PATCH /:id/role`, `PATCH /request-role/:id` (admin), `POST /request-role` (user) |
| `users.controller.js` | Handlers de Express |
| `users.service.js` | Lógica: listado de usuarios, cambio de roles, solicitudes de Wholesaler (Prisma) |

### 2.6 AI (`src/modules/ai/`)

| Archivo | Rol | Feature Flag |
|---------|-----|--------------|
| `ai.routes.js` | `POST /autocomplete-product`, `POST /generate-description` | `hasAIFeatures` |
| `ai.controller.js` | Handlers que consumen servicios de IA externos para autocompletar y generar descripciones |

### 2.7 Upload (`src/modules/upload/`)

| Archivo | Rol |
|---------|-----|
| `upload.routes.js` | `POST /api/upload` — sube imagen de producto a disco (Multer) |

---

## 3. Zustand Stores (`src/lib/store/`)

### `useAuthStore.js`
| Función | Descripción |
|---------|-------------|
| `setAuth(token, user)` | Guarda token JWT y datos del usuario |
| `logout()` | Limpia token y user |
| `isAuthenticated()` | Retorna `true` si hay token vigente |
| `isAdminOrEmployee()` | Verifica si el rol es Admin o Employee |
| `isAdmin()` | Verifica si el rol es Admin |

### `useCartStore.js`
| Función | Descripción |
|---------|-------------|
| `addToCart(product)` | Agrega producto o incrementa cantidad |
| `removeFromCart(productId)` | Elimina producto del carrito |
| `decreaseQuantity(productId)` | Reduce cantidad (elimina si llega a 0) |
| `clearCart()` | Vacía el carrito |
| `getTotalItems()` | Retorna cantidad total de ítems |
| `getTotalPrice()` | Retorna precio total calculado |

### `useFavoritesStore.js`
| Función | Descripción | Feature Flag |
|---------|-------------|--------------|
| `toggleFavorite(product)` | Agrega o quita de favoritos | `hasFavorites` |
| `isFavorite(productId)` | Verifica si un producto está en favoritos | `hasFavorites` |
| `clearFavorites()` | Limpia todos los favoritos | `hasFavorites` |
| `getTotalFavorites()` | Retorna cantidad de favoritos | `hasFavorites` |

### `useSearchStore.js`
| Función | Descripción |
|---------|-------------|
| `setSearchQuery(query)` | Actualiza la query de búsqueda |
| `clearSearch()` | Limpia la búsqueda |

---

## 4. Componentes UI (`src/components/`)

| Componente | Archivo | Descripción | Stores Consumidos |
|------------|---------|-------------|-------------------|
| Header | `Header.jsx` | Barra de navegación principal, búsqueda, carrito inline, perfil | `useAuthStore`, `useCartStore`, `useFavoritesStore`, `useSearchStore` |
| Footer | `Footer.jsx` | Pie de página con links, newsletter, social | — |
| AddProductModal | `AddProductModal.jsx` | Modal de creación de producto (dashboard) | — |
| EditProductModal | `EditProductModal.jsx` | Modal de edición de producto (dashboard) | — |
| DeleteProductModal | `DeleteProductModal.jsx` | Modal de confirmación de eliminación | — |
| BulkProductUploadModal | `BulkProductUploadModal.jsx` | Carga masiva de productos desde CSV/Excel | — |
| BulkDeleteModal | `BulkDeleteModal.jsx` | Eliminación masiva de productos | — |
| BulkPriceEditModal | `BulkPriceEditModal.jsx` | Edición masiva de precios | — |
| StockUpdateModal | `StockUpdateModal.jsx` | Actualización de stock individual | — |
| PhysicalSaleModal | `PhysicalSaleModal.jsx` | Registro de venta física en tienda | — |
| ProductCard | `catalog/ProductCard.jsx` | Tarjeta de producto reutilizable (catálogo) | `useCartStore`, `useFavoritesStore` |

---

## 5. Middlewares (`src/middlewares/`)

| Archivo | Descripción |
|---------|-------------|
| `auth.middleware.js` | Verifica JWT en headers, inyecta `req.user`. Exporta `authenticate`, `requireAuth`, `requireAdmin` |
| `roles.middleware.js` | RBAC: `requireRoles(...roles)` — restringe acceso por nombre de rol |

---

## 6. Configuración de Tema (`src/config/`)

| Archivo | Descripción |
|---------|-------------|
| `tenantConfig.json` | Configuración central: brand, theme, fonts, features, metadata |
| `loadThemeVars.js` | Helper que exporta secciones del config para uso en Tailwind y CSS |
