# Aurora Travels Frontend

Aplicación base en React + TypeScript para la agencia boutique de viajes **Aurora Travels**. Este proyecto utiliza Vite como bundler, Tailwind CSS como capa de estilos utilitarios y una arquitectura modular pensada para escalar nuevas funcionalidades rápidamente.

## Stack

- React 18 con TypeScript
- React Router 6.27
- TanStack Query para manejo de datos remotos
- Tailwind CSS 3.4 para utilidades y tokens personalizados
- ESlint + Prettier configurados con el modo flat de ESLint

## Scripts principales

- `npm run dev`: levanta el servidor de desarrollo en `http://localhost:5173/`.
- `npm run build`: construye la aplicación optimizada para producción.
- `npm run preview`: sirve el build de producción de manera local.
- `npm run lint`: ejecuta las reglas de ESLint.
- `npm run format`: formatea el código con Prettier.

## Estructura de carpetas

- `src/app`: configuración de layout, rutas y proveedores globales.
- `src/components`: componentes reutilizables (accesibilidad, UI, etc.).
- `src/features`: módulos verticales con páginas y secciones específicas.
- `src/styles`: estilos globales y setup de Tailwind.
- `src/assets`: elementos gráficos (logotipo, ilustraciones, íconos).

## Puesta en marcha

```bash
cd projectFront
npm install
npm run dev
```

> _Nota_: en PowerShell es posible que necesites habilitar la ejecución de scripts para ejecutar `npm`. Puedes hacerlo temporalmente con `Set-ExecutionPolicy -Scope Process Bypass`.

## Próximos pasos sugeridos

- Conectar con la API del backend (`projectBack`) para obtener catálogos dinámicos.
- Añadir pruebas de componentes con Vitest + React Testing Library.
- Crear un sistema de diseño compartido con tokens tipográficos y de espaciado.

# Travel Agency Backend

Backend base para una operadora de turismo colombiana, construido con Node.js, Express y TypeScript.
El sistema gestiona sesiones de planificación de viaje donde los usuarios (autenticados o invitados) pueden definir intereses, fechas, tipo de experiencia, número de viajeros y restricciones.

---

## Tabla de contenidos

1. [Stack y requisitos](#stack-y-requisitos)
2. [Arquitectura y organización](#arquitectura-y-organización)
3. [Configuración de entorno](#configuración-de-entorno)
4. [Scripts disponibles](#scripts-disponibles)
5. [Ejecución local](#ejecución-local)
6. [Convenciones de desarrollo](#convenciones-de-desarrollo)
7. [Integración con frontend](#integración-con-frontend)
8. [API](#api)
   - [POST /api/sesion/iniciar](#post-apisisioniniciar)
9. [Pruebas](#pruebas)
10. [Roadmap inicial](#roadmap-inicial)
11. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Stack y requisitos

- **Runtime:** Node.js >= 20 (modo ESM)  
- **Gestor de dependencias:** npm >= 9  
- **Lenguaje:** TypeScript 5  
- **Framework:** Express 4  
- **Otros:** Zod (validación), Pino (logging), Jest/Supertest (testing)

> 💡 En Windows se recomienda ejecutar los comandos con **Git Bash** para evitar restricciones de PowerShell con `npm` y scripts.

## Arquitectura y organización

Proyecto modular siguiendo principios de Clean Architecture ligera:

```
src/
  app.ts               # Configuración principal de Express
  server.ts            # Entrada de la aplicación (HTTP server)
  config/              # Configuraciones (env, logger, etc.)
  middlewares/         # Middlewares transversales
  routes/              # Registro de endpoints
    public/            # Rutas públicas (sin autenticación)
  modules/             # Módulos de dominio (ej. session/)
    session/           # Lógica de la sesión de planificación
  shared/              # Utilidades y tipos compartidos
tests/                 # Suite de pruebas (unitarias/E2E)
env/sample.env         # Plantilla con variables de entorno
types/                 # Tipos globales (ambient declarations)
```

### Decisiones clave
- **Validación** con Zod para controlar la entrada de datos y garantizar respuestas consistentes.
- **Repositorio en memoria** (`InMemorySessionRepository`) para prototipado rápido; listo para ser reemplazado por una implementación real (MongoDB, PostgreSQL u otro) sin tocar la capa de servicio/controlador.
- **Logging** con Pino y `pino-http` para trazabilidad de solicitudes y debugging.
- **Errores centralizados** con `HttpError` y middleware `errorHandler` para respuestas uniformes (`status`, `message`, `details`).

## Configuración de entorno

1. Duplica la plantilla y crea tu `.env`:
   ```bash
   cp env/sample.env .env
   ```
2. Variables disponibles:
   - `NODE_ENV`: `development` | `test` | `production`
   - `PORT`: Puerto HTTP (por defecto 3000)
   - `LOG_LEVEL`: `fatal` | `error` | `warn` | `info` | `debug` | `trace`

Las variables se validan al inicio con Zod; si falta algo se detiene el arranque.

## Scripts disponibles

- `npm run dev`: Inicia el servidor con `tsx` en modo watch (recarga en caliente).
- `npm run build`: Compila TypeScript a JavaScript en `dist/` (usa `tsconfig.build.json`).
- `npm run start`: Ejecuta la versión compilada (necesita `npm run build` previo).
- `npm run lint`: Ejecuta ESLint (configuración flat + TypeScript + Prettier).
- `npm run lint:fix`: Igual que anterior pero auto-corrige donde sea posible.
- `npm run test`: Corre la suite de pruebas con Jest.
- `npm run test:watch`: Ejecuta pruebas en modo watch.
- `npm run prepare`: Instala hooks de Husky (se ejecuta automáticamente tras `npm install`).

## Ejecución local

```bash
# 1. Instala dependencias
npm install

# 2. Levanta el servidor en desarrollo (recarga automática)
npm run dev

# 3. API disponible en
http://localhost:3000
```

> Si estás en Windows y PowerShell bloquea los scripts, usa Git Bash:  
> `C:\Program Files\Git\bin\bash.exe -lc "cd /c/Users/User/Documents/Cursor/projectBack && npm install"`

## Convenciones de desarrollo

- **Código** en TypeScript estrictamente tipado (`strict: true`).
- **Import aliases**: `@/` apunta a `src/`, y existen alias específicos (`@modules`, `@config`, etc.).
- **Commits** validados por Husky + lint-staged (Prettier sobre `.ts`, `.js`, `.json`, `.md` y ESLint en `src/**/*.ts`).  
- **Errores** se propagan como `HttpError` para garantizar respuestas consistentes.
- **Testing**: se fomenta TDD para módulos nuevos, utilizando Jest + Supertest para endpoints.

## API

### POST /api/sesion/iniciar

Crea una nueva sesión de planificación para un usuario autenticado (con `usuarioId`) o invitado (sin `usuarioId`). Genera un `session_id` (`UUID`), registra intereses, fechas, tipo de experiencia, número de viajeros y restricciones.

**Request**
```http
POST /api/sesion/iniciar
Content-Type: application/json
```
```jsonc
{
  "usuarioId": "usr-123",          // opcional, string no vacío
  "intereses": ["aventura"],       // array con al menos un elemento
  "fechaInicio": "2025-12-10",     // fecha válida (ISO, timestamp o similar)
  "fechaFin": "2025-12-20",        // debe ser >= fechaInicio
  "tipoExperiencia": "Andes Trek", // string no vacío
  "numeroViajeros": 2,             // entero entre 1 y 99
  "restricciones": ["vegetariano"] // array de strings, por defecto []
}
```

**Response 201**
```json
{
  "status": "success",
  "data": {
    "session": {
      "id": "7c85...",
      "usuarioId": "usr-123",
      "esInvitado": false,
      "intereses": ["aventura"],
      "fechaInicio": "2025-12-10T00:00:00.000Z",
      "fechaFin": "2025-12-20T00:00:00.000Z",
      "tipoExperiencia": "Andes Trek",
      "numeroViajeros": 2,
      "restricciones": ["vegetariano"],
      "estado": "planificacion",
      "createdAt": "2024-05-01T12:00:00.000Z",
      "updatedAt": "2024-05-01T12:00:00.000Z"
    }
  }
}
```

**Response 400** (validación)
```json
{
  "status": "error",
  "message": "Los datos proporcionados no son válidos",
  "details": {
    "fechaFin": [
      "La fecha de fin debe ser posterior o igual a la fecha de inicio"
    ]
  }
}
```

**Ejemplo con cURL**
```bash
curl -X POST http://localhost:3000/api/sesion/iniciar \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "usr-123",
    "intereses": ["aventura", "gastronomia"],
    "fechaInicio": "2025-12-10",
    "fechaFin": "2025-12-20",
    "tipoExperiencia": "Aventura Andina",
    "numeroViajeros": 2,
    "restricciones": ["vegetariano"]
  }'
```

Para simular un invitado, omite `usuarioId`.

## Integración con frontend

- **Base URL por defecto:** `http://localhost:3000`
- **Endpoint:** `POST /api/sesion/iniciar`
- **Headers requeridos:** `Content-Type: application/json`
- **Payload esperado:**
  ```jsonc
  {
    "usuarioId": "usr-123",          // opcional
    "intereses": ["aventura"],       // mínimo un elemento
    "fechaInicio": "2025-12-10",     // formato ISO recomendado
    "fechaFin": "2025-12-20",
    "tipoExperiencia": "Aventura",
    "numeroViajeros": 2,
    "restricciones": ["vegetariano"] // puede ser []
  }
  ```
- **Respuesta exitosa (201):**
  ```json
  {
    "status": "success",
    "data": {
      "session": {
        "id": "uuid",
        "usuarioId": "usr-123",
        "esInvitado": false,
        "intereses": ["aventura"],
        "fechaInicio": "2025-12-10T00:00:00.000Z",
        "fechaFin": "2025-12-20T00:00:00.000Z",
        "tipoExperiencia": "Aventura",
        "numeroViajeros": 2,
        "restricciones": ["vegetariano"],
        "estado": "planificacion",
        "createdAt": "2025-05-01T12:00:00.000Z",
        "updatedAt": "2025-05-01T12:00:00.000Z"
      }
    }
  }
  ```
- **Errores de validación (400):**
  ```json
  {
    "status": "error",
    "message": "Los datos proporcionados no son válidos",
    "details": {
      "fechaFin": [
        "La fecha de fin debe ser posterior o igual a la fecha de inicio"
      ]
    }
  }
  ```
- **Sesiones invitadas:** omitir `usuarioId` → el backend devolverá `esInvitado: true`.
- **Manejo en frontend:** almacenar `session.id` en el estado global/localStorage para futuras llamadas.

## Pruebas

- **Tests E2E:** `tests/sessions/start-session.e2e.test.ts` valida la creación correcta y los escenarios de error.
- **Ejecutar suite completa:**
  ```bash
  npm test
  ```
- **Modo watch:**
  ```bash
  npm run test:watch
  ```

> Antes de correr tests en CI, ejecutar `npm run build` garantiza que los tipos están alineados.

## Roadmap inicial

- [ ] Persistencia real para sesiones (ej. MongoDB / PostgreSQL)
- [ ] Autenticación/OAuth para usuarios recurrentes
- [ ] Catálogo de experiencias turísticas
- [ ] Motor de recomendaciones basadas en intereses y restricciones
- [ ] Gestión de itinerarios y cotizaciones

## Preguntas frecuentes

**¿Cómo cambio el puerto?**  
Edita `PORT` en `.env` o exporta la variable antes de iniciar: `PORT=4000 npm run dev`.

**¿Cómo habilito logs más verbosos?**  
Establece `LOG_LEVEL=debug` o `trace` en `.env`.

**¿Dónde reemplazo la capa de persistencia?**  
Implementa `SessionRepository` en `src/modules/session/session.repository.ts` y pásalo al `SessionService`. El controlador no necesita cambios.

**¿Qué sucede si falla la validación?**  
Las respuestas siguen el formato `{ status: "error", message, details }` con `HttpStatus.BAD_REQUEST`.

---

Made with ☕ by el equipo de backend de la operadora de turismo colombiana.


# proyectoBack
