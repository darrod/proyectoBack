# Travel Agency Backend

Backend base para la operadora de turismo colombiana Aurora Travels. Construido con Node.js, Express y TypeScript, ofrece el flujo inicial para planificar viajes destacando los intereses, fechas, tipo de experiencia, número de viajeros y restricciones de los clientes.

---

## Tabla de contenido

1. [Stack y requisitos](#stack-y-requisitos)
2. [Arquitectura y estructura](#arquitectura-y-estructura)
3. [Configuración de entorno](#configuración-de-entorno)
4. [Instalación y ejecución](#instalación-y-ejecución)
5. [Scripts disponibles](#scripts-disponibles)
6. [Estándares y convenciones](#estándares-y-convenciones)
7. [API](#api)
   - [POST /api/sesion/iniciar](#post-apisisioniniciar)
8. [Integración con frontend](#integración-con-frontend)
9. [Pruebas](#pruebas)
10. [Roadmap inicial](#roadmap-inicial)
11. [FAQ](#faq)

---

## Stack y requisitos

- **Runtime:** Node.js >= 20 (ESM habilitado)
- **Gestor de paquetes:** npm >= 9
- **Lenguaje:** TypeScript 5
- **Framework:** Express 4
- **Utilidades:**
  - Zod para validación
  - Pino + pino-http para logging
  - Jest + Supertest para pruebas
  - TSX para desarrollo en caliente

> 💡 En Windows se recomienda ejecutar los comandos con **Git Bash** para evitar restricciones de PowerShell al momento de correr `npm` o scripts shell.

## Arquitectura y estructura

El proyecto sigue una arquitectura modular con separación por dominios y capas.

```text
src/
  app.ts                 # Configuración principal de Express
  server.ts              # Punto de arranque HTTP
  config/                # Configuraciones (env, logger)
  middlewares/           # Middlewares transversales
  modules/
    session/             # Caso de uso de sesiones de planificación
      session.controller.ts
      session.repository.ts
      session.router.ts
      session.schema.ts
      session.service.ts
      session.types.ts
  routes/                # Registro centralizado de rutas
    public/              # Rutas públicas (ej. health)
  shared/                # Utilidades compartidas (HttpError, HttpStatus, etc.)
  tests/                 # Pruebas (unitarias/E2E)
types/                   # Tipos globales
env/                     # Plantillas de variables de entorno
```

### Decisiones clave
- **Validación robusta** con Zod para asegurar datos coherentes antes de llegar a la capa de dominio.
- **Repositorio en memoria** (`InMemorySessionRepository`) listo para sustituirse por una base de datos real sin modificar el controlador.
- **Logging estructurado** con Pino y formateo legible en entornos no productivos.
- **Manejo de errores unificado** mediante `HttpError` y un `errorHandler` central.

## Configuración de entorno

1. Copia la plantilla y crea tu archivo `.env`:
   ```bash
   cp env/sample.env .env
   ```
2. Variables disponibles:
   - `NODE_ENV`: `development` | `test` | `production`
   - `PORT`: Puerto HTTP (por defecto 3000)
   - `LOG_LEVEL`: `fatal` | `error` | `warn` | `info` | `debug` | `trace`

Las variables se validan con Zod durante el arranque. Si falta alguna obligatoria, la aplicación se detiene con un mensaje claro.

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Modo desarrollo con recarga automática
tsx watch src/server.ts
# o a través del script
npm run dev

# Compilar a JavaScript y ejecutar build
npm run build
npm run start
```

> Si PowerShell bloquea el comando `npm`, ejecuta temporalmente: `Set-ExecutionPolicy -Scope Process Bypass`. Otra opción es usar Git Bash:
> ```bash
> "C:\Program Files\Git\bin\bash.exe" -lc "cd /c/Users/User/Documents/Cursor/projectBack && npm install"
> ```

## Scripts disponibles

- `npm run dev`: levanta el servidor en modo desarrollo (`tsx watch`).
- `npm run build`: genera el build en `dist/` utilizando `tsconfig.build.json`.
- `npm run start`: ejecuta la versión compilada (requiere build previo).
- `npm run lint`: corre ESLint en modo verificación.
- `npm run lint:fix`: intenta corregir problemas de lint automáticamente.
- `npm run test`: ejecuta la suite de Jest.
- `npm run test:watch`: corre Jest en modo observador.
- `npm run prepare`: instala los hooks de Husky (se ejecuta automáticamente tras `npm install`).

## Estándares y convenciones

- **Tipado estricto:** `strict: true` en TypeScript.
- **Imports con alias:**
  - `@/` → `src/`
  - `@modules/` → `src/modules/`
  - `@config/` → `src/config/`
  - `@shared/` → `src/shared/`
- **Pre-commit:** Husky + lint-staged ejecutan Prettier y ESLint en los archivos modificados.
- **Registro de solicitudes:** `requestLogger` con `pino-http`, ignora endpoints de salud.
- **Respuestas de error homogéneas:** `{ status: "error", message, details }`.

## API

### POST /api/sesion/iniciar

Crea una nueva sesión de planificación para el flujo de viajes. Admite usuarios autenticados (`usuarioId`) o invitados.

**Request**
```http
POST /api/sesion/iniciar
Content-Type: application/json
```
```jsonc
{
  "usuarioId": "usr-123",          // opcional
  "intereses": ["aventura"],       // mínimo un elemento
  "fechaInicio": "2025-12-10",     // fecha válida (ISO recomendado)
  "fechaFin": "2025-12-20",        // debe ser >= fechaInicio
  "tipoExperiencia": "Andes Trek",
  "numeroViajeros": 2,              // entero 1..99
  "restricciones": ["vegetariano"] // array opcional
}
```

**Respuesta 201**
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
      "createdAt": "2025-05-01T12:00:00.000Z",
      "updatedAt": "2025-05-01T12:00:00.000Z"
    }
  }
}
```

**Respuesta 400 (validación)**
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
- **Payload:** mismo formato descrito en la sección anterior.
- **Persistencia en cliente:** conservar `session.id` en estado global o almacenamiento local para futuras interacciones.
- **Sesiones invitadas:** el backend devuelve `esInvitado: true` cuando no se envía `usuarioId`.
- **Manejo de errores:** usar la propiedad `details` para mostrar mensajes específicos por campo.

## Pruebas

- **Tests E2E:** `tests/sessions/start-session.e2e.test.ts` valida tanto la creación correcta como los errores de validación.
- **Comandos útiles:**
  ```bash
  npm test          # ejecución única
  npm run test:watch
  ```
- Antes de un pipeline CI/CD ejecutar `npm run build` para garantizar que los tipos y el código compilan correctamente.

## Roadmap inicial

- [ ] Integrar una base de datos real para almacenar sesiones.
- [ ] Añadir autenticación/OAuth para usuarios registrados.
- [ ] Exponer catálogo de experiencias turísticas.
- [ ] Implementar motor de recomendaciones personalizadas.
- [ ] Gestionar itinerarios, cotizaciones y pagos.

## FAQ

**¿Cómo cambio el puerto?**  
Modifica `PORT` en `.env` o exporta la variable antes de iniciar: `PORT=4000 npm run dev`.

**¿Puedo cambiar el nivel de logging?**  
Sí, ajusta `LOG_LEVEL`; en desarrollo suele usarse `debug`.

**¿Dónde reemplazo la persistencia?**  
Implementa la interfaz `SessionRepository` con la base de datos de tu elección y pásala al `SessionService` durante la construcción del router.

**¿Qué pasa con la validación?**  
Si Zod detecta errores se lanza un `HttpError` con detalles por campo; el frontend debe apoyarse en `details` para mostrar mensajes amigables.

---

Made with ☕ por el equipo backend de Aurora Travels.


# proyectoBack
