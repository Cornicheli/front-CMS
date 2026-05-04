# AdTech CMS — DOOH Platform

Frontend de gestión de contenidos y monitoreo para una red de pantallas DOOH (Digital Out-Of-Home) en Buenos Aires. Desarrollado como prueba técnica para LatinAd.

## Stack

- **Angular 21** — standalone components, signals, `input()` / `output()`
- **Tailwind CSS** — design system AC Fusion (dark mode, paleta violeta/navy)
- **TypeScript** — tipado estricto
- **RxJS** — manejo de llamadas HTTP
- **Angular Reactive Forms** — formulario de alta/edición de contenidos

## Requisitos

- Node.js 18+
- npm 9+
- Backend corriendo en `http://localhost:3001` (ver `back-CMS/README.md`)

## Instalación

```bash
npm install
ng serve
```

Abre `http://localhost:4200` en el navegador.

## Credenciales de prueba

```
usuario: admin
contraseña: admin123
```

## Estructura del proyecto

```
src/app/
├── core/
│   ├── constants/        # API_URL base
│   ├── guards/           # authGuard (JWT)
│   └── services/         # ThemeService
├── features/
│   ├── auth/
│   │   └── login/        # Página de login con rememberMe
│   ├── contents/
│   │   ├── layout/       # Contenedor principal del dashboard
│   │   ├── content-grid/ # Grid de contenidos con CRUD
│   │   ├── content-form/ # Modal alta/edición
│   │   ├── filter-bar/   # Filtros por tipo, categoría, búsqueda
│   │   ├── sidebar/      # Árbol de carpetas
│   │   └── services/     # ContentService (HTTP + signals)
│   └── monitor/
│       ├── monitor.component       # Contenedor del centro de monitoreo
│       ├── monitor-map/            # Mapa SVG interactivo por zonas
│       ├── monitor-grid/           # Grid de contenidos en rotación
│       ├── proof-of-play-modal/    # Modal con log de reproducciones
│       └── monitor-screen.service  # Estado online/offline de pantallas
├── shared/
│   ├── app-sidebar/      # Sidebar colapsable (nav + carpetas + usuario)
│   ├── app-right-rail/   # Panel Smart Triggers + Proof of Play
│   └── media-thumb/      # Thumbnail de imagen/video con overlay
└── models/               # Interfaces TypeScript (Content, Folder, etc.)
```

## Funcionalidades

### Autenticación
- Login con JWT — `POST /auth/login`
- `rememberMe`: persiste el token en `localStorage` o `sessionStorage`
- `authGuard` protege todas las rutas privadas

### Dashboard — Gestión de Contenidos (`/dashboard`)
- Listado de contenidos en grid con métricas (Reach, Rev, CTR)
- Filtros en tiempo real: búsqueda por nombre, tipo (imagen/video), categoría
- Vista de archivados
- Árbol de carpetas con navegación jerárquica (sidebar)
- **Crear** contenido — `POST /api/contents`
- **Editar** contenido — `PUT /api/contents/:id`
- **Archivar / Desarchivar** — `PATCH /api/contents/:id`
- **Eliminar** con confirmación inline — `DELETE /api/contents/:id`
- KPIs en header: NET health, plays activos, revenue/h, errores
- Panel derecho colapsable: Smart Triggers y Proof of Play stream en vivo

### Centro de Monitoreo (`/monitor`)
- Mapa SVG de Buenos Aires con pins por zona (CABA Centro, Palermo, Retiro, Puerto Madero, San Telmo)
- Click en pin filtra el inventario por zona
- Timeline de 24h con actividad de reproducciones
- Grid de contenidos en rotación con estado online/offline
- Modal **Proof of Play** con log de las últimas 20 reproducciones (hora, duración, resultado)
- Toggle online/offline por pantalla

## API

El frontend consume el backend de `back-CMS` en:

```
https://back-cms-4ag6.onrender.com   ← producción (por defecto)
http://localhost:3001                 ← local (comentado en api.constants.ts)
```

Para cambiar al backend local editar `src/app/core/constants/api.constants.ts`.

## Build de producción

```bash
ng build
```

Los artefactos quedan en `dist/`. El archivo `public/_redirects` configura el routing SPA para Netlify/Render.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `ng serve` | Dev server en `localhost:4200` |
| `ng build` | Build de producción |
| `ng test` | Tests unitarios (Vitest) |
