# AdTech CMS — DOOH Platform

Frontend de gestión de contenidos y monitoreo para una red de pantallas DOOH (Digital Out-Of-Home) en Buenos Aires. Desarrollado como prueba técnica para LatinAd.

## Stack

- **Angular 21** — standalone components, signals, `input()` / `output()`
- **Tailwind CSS** — design system AC Fusion (dark mode, paleta violeta/navy)
- **TypeScript** — tipado estricto
- **RxJS** — manejo de llamadas HTTP
- **Angular Signals Forms** — formulario de alta/edición de contenidos (developer preview)

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
│   └── interceptors/     # authInterceptor (funcional)
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

---

## Decisiones de diseño y por qué

### localStorage vs sessionStorage para el token JWT

El login tiene un checkbox **Recordarme**. Cuando está activo, el token se guarda en `localStorage`; cuando no, en `sessionStorage`.

**Por qué este tradeoff:** `localStorage` persiste entre sesiones y pestañas — conveniente para operadores que trabajan toda la jornada en el CMS. `sessionStorage` se borra al cerrar el tab — más conservador para accesos en equipos compartidos.

**Riesgo considerado:** `localStorage` es accesible desde JavaScript, por lo que un ataque XSS podría leer el token. La alternativa más segura es una cookie `httpOnly` (inaccesible desde JS), pero eso requería un cambio en el backend que estaba fuera del scope del ejercicio. Para una versión de producción real lo cambiaría a cookies `httpOnly` + `SameSite=Strict`.

**Mitigación aplicada:** ningún dato sensible viaja en el payload del JWT más allá del `username` y el `userId`. Si el token fuera robado, el atacante puede hacer llamadas a la API del CMS, pero no tiene impacto más allá de eso.

---

### Interceptor HTTP centralizado y no otra estrategia

Uso `HttpInterceptorFn` (forma funcional de Angular 14+) registrado una sola vez en `app.config.ts`.

**Por qué un interceptor:** el header `Authorization: Bearer <token>` debe adjuntarse a cada llamada autenticada. Las alternativas descartadas fueron:

- **Wrapper service sobre HttpClient** — requiere que todos los servicios llamen al wrapper en lugar de HttpClient directamente. Propenso a omisiones, difícil de mantener.
- **Inyectar el token manualmente en cada llamada** — código repetido en cada `http.get()` / `http.post()`.
- **Class-based interceptor** — más verboso sin beneficio real en este contexto.

El interceptor funcional es tree-shakeable, testeable de forma aislada y tiene una única responsabilidad: leer el token del `AuthService` e inyectar el header. Si el token no existe (usuario no autenticado), la request pasa sin modificar.

---

### Estado de los filtros en el servicio, no en la URL ni en localStorage

Los filtros viven en `ContentService.filters` como un `signal<ContentFilters>({})`. El componente `FilterBarComponent` emite cambios vía `output()`, y el layout los propaga al servicio con `updateFilters()`.

**Por qué no la URL (query params):** sería útil si se necesitara compartir vistas filtradas o deep-linking. Para un CMS interno donde los operadores trabajan sobre su propia sesión, agrega complejidad innecesaria (sincronización router ↔ signal, serialización/deserialización de tipos). Si el producto creciera hacia vistas colaborativas, lo migraría a query params.

**Por qué no localStorage:** los filtros son contexto efímero de la sesión de trabajo, no una preferencia del usuario. Persistirlos sería ruido: si el operador cierra y reabre la app, probablemente quiere empezar desde cero.

**Por qué el servicio:** el `ContentService` ya posee los datos (`contents`, `categories`, `folders`). Centralizar los filtros ahí permite que `filteredContents` sea un `computed()` que reactivamente re-evalúa sin coordinación externa. Todo el estado relacionado con contenidos vive en un solo lugar.

---

### Estrategia de validación: híbrida (tiempo real + submit)

Hay dos contextos con lógica distinta:

**Barra de filtros:** la búsqueda de texto usa `debounceTime(300ms)` + `distinctUntilChanged()` para no re-filtrar en cada keystroke. Los dropdowns de tipo y categoría reaccionan inmediatamente porque la selección ya es completa (no hay estado intermedio). La validación "en tiempo real" acá es apropiada porque no hay consecuencias negativas para el usuario — simplemente se actualiza el grid.

**Formulario de contenido:** uso `submit()` de Angular Signals Forms. Los errores de validación se muestran **solo al hacer clic en Guardar**, no mientras el usuario completa el formulario. Elegí esto porque mostrar errores mientras el usuario todavía está escribiendo genera ansiedad y mala UX (el campo de URL marca error desde el primer caracter). La excepción son los dropdowns custom (categoría, carpeta) que muestran error al tocarse (`touched` signal manual), porque ahí el usuario tomó una decisión activa de no seleccionar.

---

### Modal y no página separada para el formulario de contenido

El formulario de alta/edición se abre como un overlay modal sobre el grid, no como una ruta nueva (`/dashboard/new` o `/dashboard/:id/edit`).

**Por qué modal:** el operador puede ver el grid mientras edita, lo que da contexto visual (especialmente útil al editar — puede comparar con otros contenidos sin navegar). Tampoco pierde el scroll position ni los filtros activos. La transición es instantánea sin navegación.

**Por qué no una página separada:** si el formulario fuera una ruta, habría que serializar el estado de filtros en la URL o en un store compartido para que al volver el dashboard no quedara reseteado. Agrega coordinación innecesaria para un formulario simple.

**Contraargumento reconocido:** un modal dificulta compartir links directos a un contenido en edición. Para un CMS colaborativo con múltiples operadores, una ruta propia (`/dashboard/contents/:id/edit`) sería más apropiada.

---

### ¿Qué haría distinto con más tiempo?

- **Tests unitarios del ContentService y AuthService** — son los nodos críticos de la app y actualmente no tienen cobertura de Vitest.
- **Validación de expiración del JWT en el guard** — hoy el `authGuard` solo verifica que el token exista, no que sea válido. Un token expirado produce un 401 en la primera llamada HTTP en lugar de redirigir proactivamente al login.
- **Filtros en la URL como query params** — habilitaría deep-linking y que el navegador recuerde el estado al hacer back.
- **Optimistic updates con rollback** — las mutaciones (crear, editar, archivar) actualizan el estado local solo en el `tap()` del observable, es decir, después de que el backend confirma. Con optimistic updates la UI respondería instantáneamente y haría rollback en caso de error de red.
- **Accesibilidad (a11y)** — los dropdowns custom (tipo, categoría, carpeta) no tienen atributos ARIA correctos. Los usaría con `role="listbox"` + `aria-expanded` para que sean accesibles con teclado y lectores de pantalla.

---

### ¿Qué parte fue la más desafiante?

La integración de **Angular Signals Forms** (`@angular/forms/signals`). Esta API está en developer preview en Angular 21 y la documentación oficial era escasa al momento del desarrollo. El modelo funcional (`form()`, `submit()`, `required()`, `pattern()`) difiere del Reactive Forms tradicional, y los dropdowns custom (categoría, carpeta, tipo) no encajan directamente en el `FormField` de la API porque son elementos HTML nativos reemplazados por divs animados. Resolví esto con signals de `touched` manuales y `computed()` para los mensajes de error, fuera del grafo de `contentForm`, coordinando ambos en el `onSubmit()`.
