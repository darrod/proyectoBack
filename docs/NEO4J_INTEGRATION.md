# Guía de Integración con Neo4j

Este documento proporciona ejemplos prácticos de cómo integrar Neo4j en el proyecto backend.

## 📦 Instalación

```bash
npm install neo4j-driver
npm install --save-dev @types/neo4j-driver
```

## 🔧 Configuración

### 1. Actualizar variables de entorno

Editar `env/sample.env`:

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password
NEO4J_DATABASE=neo4j
```

### 2. Actualizar `src/config/env.ts`

```typescript
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  // Neo4j
  NEO4J_URI: z.string().url().default("bolt://localhost:7687"),
  NEO4J_USER: z.string().min(1).default("neo4j"),
  NEO4J_PASSWORD: z.string().min(1),
  NEO4J_DATABASE: z.string().default("neo4j")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Variables de entorno inválidas:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("La configuración de entorno es inválida.");
}

export const appEnv = parsedEnv.data;
export type AppEnv = typeof appEnv;
```

### 3. Crear `src/config/database.ts`

```typescript
import neo4j, { Driver } from "neo4j-driver";
import { appEnv } from "./env.js";
import { logger } from "./logger.js";

let driver: Driver | null = null;

export function getGraphDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      appEnv.NEO4J_URI,
      neo4j.auth.basic(appEnv.NEO4J_USER, appEnv.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        disableLosslessIntegers: true
      }
    );

    // Verificar conexión
    driver
      .verifyConnectivity()
      .then(() => {
        logger.info("✅ Conexión a Neo4j establecida correctamente");
      })
      .catch((error) => {
        logger.error({ err: error }, "❌ Error al conectar con Neo4j");
      });
  }
  return driver;
}

export async function closeGraphDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info("Conexión a Neo4j cerrada");
  }
}
```

### 4. Actualizar `src/server.ts` para cerrar conexión al apagar

```typescript
import http from "node:http";

import { createApp } from "./app.js";
import { appEnv } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeGraphDriver } from "./config/database.js";

const app = createApp();
const server = http.createServer(app);

const port = appEnv.PORT;

server.listen(port, () => {
  logger.info(`🚀 Servidor escuchando en http://localhost:${port} (${appEnv.NODE_ENV})`);
});

const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Recibida señal ${signal}, cerrando servidor...`);
    
    // Cerrar conexión a Neo4j
    await closeGraphDriver();
    
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, "Error al cerrar el servidor");
        process.exit(1);
      }
      logger.info("Servidor cerrado correctamente");
      process.exit(0);
    });
  });
});
```

## 📝 Implementación del Repository

### `src/modules/session/session.repository.ts` (Versión Neo4j)

```typescript
import type { Driver, Record } from "neo4j-driver";
import type { Session } from "./session.types.js";

export interface SessionRepository {
  create(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByUsuarioId(usuarioId: string): Promise<Session[]>;
  update(id: string, updates: Partial<Session>): Promise<Session>;
  delete(id: string): Promise<void>;
}

export class Neo4jSessionRepository implements SessionRepository {
  constructor(private readonly driver: Driver) {}

  async create(session: Session): Promise<Session> {
    const dbSession = this.driver.session();
    try {
      const result = await dbSession.executeWrite(async (tx) => {
        // 1. Crear nodo Sesion
        const createSessionQuery = `
          CREATE (s:Sesion {
            id: $id,
            estado: $estado,
            fechaInicio: date($fechaInicio),
            fechaFin: date($fechaFin),
            numeroViajeros: $numeroViajeros,
            tipoExperiencia: $tipoExperiencia,
            esInvitado: $esInvitado,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          RETURN s
        `;

        const sessionResult = await tx.run(createSessionQuery, {
          id: session.id,
          estado: session.estado,
          fechaInicio: session.fechaInicio,
          fechaFin: session.fechaFin,
          numeroViajeros: session.numeroViajeros,
          tipoExperiencia: session.tipoExperiencia,
          esInvitado: session.esInvitado
        });

        const createdSession = sessionResult.records[0].get("s").properties;

        // 2. Crear/relacionar Intereses
        if (session.intereses && session.intereses.length > 0) {
          const createInterestsQuery = `
            MATCH (s:Sesion {id: $sessionId})
            UNWIND $intereses AS interesNombre
            MERGE (i:Interes {nombre: interesNombre})
            ON CREATE SET i.id = randomUUID(), i.createdAt = datetime()
            MERGE (s)-[:TIENE_INTERES]->(i)
          `;
          await tx.run(createInterestsQuery, {
            sessionId: session.id,
            intereses: session.intereses
          });
        }

        // 3. Crear/relacionar Restricciones
        if (session.restricciones && session.restricciones.length > 0) {
          const createRestrictionsQuery = `
            MATCH (s:Sesion {id: $sessionId})
            UNWIND $restricciones AS restriccionNombre
            MERGE (r:Restriccion {tipo: restriccionNombre})
            ON CREATE SET r.id = randomUUID(), r.createdAt = datetime()
            MERGE (s)-[:TIENE_RESTRICCION]->(r)
          `;
          await tx.run(createRestrictionsQuery, {
            sessionId: session.id,
            restricciones: session.restricciones
          });
        }

        // 4. Si hay usuarioId, crear relación
        if (session.usuarioId) {
          const linkUserQuery = `
            MATCH (s:Sesion {id: $sessionId})
            MERGE (u:Usuario {id: $usuarioId})
            MERGE (u)-[:CREA]->(s)
          `;
          await tx.run(linkUserQuery, {
            sessionId: session.id,
            usuarioId: session.usuarioId
          });
        }

        return createdSession;
      });

      // Mapear resultado a tipo Session
      return this.mapNeo4jNodeToSession(result);
    } finally {
      await dbSession.close();
    }
  }

  async findById(id: string): Promise<Session | null> {
    const dbSession = this.driver.session();
    try {
      const result = await dbSession.executeRead(async (tx) => {
        const query = `
          MATCH (s:Sesion {id: $id})
          OPTIONAL MATCH (s)-[:TIENE_INTERES]->(i:Interes)
          OPTIONAL MATCH (s)-[:TIENE_RESTRICCION]->(r:Restriccion)
          OPTIONAL MATCH (s)<-[:CREA]-(u:Usuario)
          RETURN s,
                 collect(DISTINCT i.nombre) as intereses,
                 collect(DISTINCT r.tipo) as restricciones,
                 u.id as usuarioId
        `;
        return await tx.run(query, { id });
      });

      if (result.records.length === 0) {
        return null;
      }

      return this.mapNeo4jResultToSession(result.records[0]);
    } finally {
      await dbSession.close();
    }
  }

  async findByUsuarioId(usuarioId: string): Promise<Session[]> {
    const dbSession = this.driver.session();
    try {
      const result = await dbSession.executeRead(async (tx) => {
        const query = `
          MATCH (u:Usuario {id: $usuarioId})-[:CREA]->(s:Sesion)
          OPTIONAL MATCH (s)-[:TIENE_INTERES]->(i:Interes)
          OPTIONAL MATCH (s)-[:TIENE_RESTRICCION]->(r:Restriccion)
          RETURN s,
                 collect(DISTINCT i.nombre) as intereses,
                 collect(DISTINCT r.tipo) as restricciones,
                 u.id as usuarioId
          ORDER BY s.createdAt DESC
        `;
        return await tx.run(query, { usuarioId });
      });

      return result.records.map((record) => this.mapNeo4jResultToSession(record));
    } finally {
      await dbSession.close();
    }
  }

  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const dbSession = this.driver.session();
    try {
      const result = await dbSession.executeWrite(async (tx) => {
        // Construir SET dinámico
        const setClauses: string[] = ["s.updatedAt = datetime()"];
        const params: Record<string, unknown> = { id };

        if (updates.estado) {
          setClauses.push("s.estado = $estado");
          params.estado = updates.estado;
        }
        if (updates.fechaInicio) {
          setClauses.push("s.fechaInicio = date($fechaInicio)");
          params.fechaInicio = updates.fechaInicio;
        }
        if (updates.fechaFin) {
          setClauses.push("s.fechaFin = date($fechaFin)");
          params.fechaFin = updates.fechaFin;
        }
        if (updates.numeroViajeros !== undefined) {
          setClauses.push("s.numeroViajeros = $numeroViajeros");
          params.numeroViajeros = updates.numeroViajeros;
        }
        if (updates.tipoExperiencia) {
          setClauses.push("s.tipoExperiencia = $tipoExperiencia");
          params.tipoExperiencia = updates.tipoExperiencia;
        }

        const updateQuery = `
          MATCH (s:Sesion {id: $id})
          SET ${setClauses.join(", ")}
          RETURN s
        `;

        const updateResult = await tx.run(updateQuery, params);

        // Si se actualizan intereses, reemplazar relaciones
        if (updates.intereses) {
          await tx.run(
            `
            MATCH (s:Sesion {id: $id})-[r:TIENE_INTERES]->()
            DELETE r
          `,
            { id }
          );

          if (updates.intereses.length > 0) {
            await tx.run(
              `
              MATCH (s:Sesion {id: $sessionId})
              UNWIND $intereses AS interesNombre
              MERGE (i:Interes {nombre: interesNombre})
              MERGE (s)-[:TIENE_INTERES]->(i)
            `,
              { sessionId: id, intereses: updates.intereses }
            );
          }
        }

        // Si se actualizan restricciones, reemplazar relaciones
        if (updates.restricciones) {
          await tx.run(
            `
            MATCH (s:Sesion {id: $id})-[r:TIENE_RESTRICCION]->()
            DELETE r
          `,
            { id }
          );

          if (updates.restricciones.length > 0) {
            await tx.run(
              `
              MATCH (s:Sesion {id: $sessionId})
              UNWIND $restricciones AS restriccionNombre
              MERGE (r:Restriccion {tipo: restriccionNombre})
              MERGE (s)-[:TIENE_RESTRICCION]->(r)
            `,
              { sessionId: id, restricciones: updates.restricciones }
            );
          }
        }

        return updateResult.records[0].get("s").properties;
      });

      // Obtener sesión completa actualizada
      return this.findById(id) as Promise<Session>;
    } finally {
      await dbSession.close();
    }
  }

  async delete(id: string): Promise<void> {
    const dbSession = this.driver.session();
    try {
      await dbSession.executeWrite(async (tx) => {
        const query = `
          MATCH (s:Sesion {id: $id})
          DETACH DELETE s
        `;
        await tx.run(query, { id });
      });
    } finally {
      await dbSession.close();
    }
  }

  private mapNeo4jNodeToSession(node: any): Session {
    return {
      id: node.id,
      usuarioId: node.usuarioId || undefined,
      esInvitado: node.esInvitado ?? true,
      intereses: node.intereses || [],
      fechaInicio: node.fechaInicio?.toString() || new Date().toISOString(),
      fechaFin: node.fechaFin?.toString() || new Date().toISOString(),
      tipoExperiencia: node.tipoExperiencia || "",
      numeroViajeros: node.numeroViajeros || 1,
      restricciones: node.restricciones || [],
      estado: node.estado || "planificacion",
      createdAt: node.createdAt?.toString() || new Date().toISOString(),
      updatedAt: node.updatedAt?.toString() || new Date().toISOString()
    };
  }

  private mapNeo4jResultToSession(record: Record): Session {
    const sessionNode = record.get("s").properties;
    const intereses = record.get("intereses") || [];
    const restricciones = record.get("restricciones") || [];
    const usuarioId = record.get("usuarioId");

    return {
      id: sessionNode.id,
      usuarioId: usuarioId || undefined,
      esInvitado: sessionNode.esInvitado ?? !usuarioId,
      intereses: intereses.filter((i: string | null) => i !== null),
      fechaInicio: sessionNode.fechaInicio?.toString() || new Date().toISOString(),
      fechaFin: sessionNode.fechaFin?.toString() || new Date().toISOString(),
      tipoExperiencia: sessionNode.tipoExperiencia || "",
      numeroViajeros: sessionNode.numeroViajeros || 1,
      restricciones: restricciones.filter((r: string | null) => r !== null),
      estado: sessionNode.estado || "planificacion",
      createdAt: sessionNode.createdAt?.toString() || new Date().toISOString(),
      updatedAt: sessionNode.updatedAt?.toString() || new Date().toISOString()
    };
  }
}
```

## 🔄 Actualizar Router para usar Neo4j

### `src/modules/session/session.router.ts`

```typescript
import { Router } from "express";

import { getGraphDriver } from "@config/database.js";
import { Neo4jSessionRepository } from "./session.repository.js";
import { SessionService } from "./session.service.js";
import { SessionController } from "./session.controller.js";

// Usar Neo4j en lugar de InMemory
const sessionRepository = new Neo4jSessionRepository(getGraphDriver());
const sessionService = new SessionService(sessionRepository);
const sessionController = new SessionController(sessionService);

export const sessionRouter = Router();

sessionRouter.post("/iniciar", sessionController.iniciarSesion);
```

## 📊 Crear Índices en Neo4j

Ejecutar en Neo4j Browser o crear script de migración:

```cypher
// Índices para búsquedas rápidas
CREATE INDEX sesion_id IF NOT EXISTS FOR (s:Sesion) ON (s.id);
CREATE INDEX usuario_id IF NOT EXISTS FOR (u:Usuario) ON (u.id);
CREATE INDEX interes_nombre IF NOT EXISTS FOR (i:Interes) ON (i.nombre);
CREATE INDEX restriccion_tipo IF NOT EXISTS FOR (r:Restriccion) ON (r.tipo);

// Constraints para garantizar unicidad
CREATE CONSTRAINT sesion_id_unique IF NOT EXISTS
FOR (s:Sesion) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT usuario_id_unique IF NOT EXISTS
FOR (u:Usuario) REQUIRE u.id IS UNIQUE;
```

## 🧪 Testing

### Mock del Driver para Tests

```typescript
// tests/helpers/neo4j-mock.ts
import type { Driver } from "neo4j-driver";

export function createMockDriver(): Driver {
  // Implementar mock según necesidad
  // Usar biblioteca como neo4j-driver-mock si está disponible
}
```

## 🚀 Próximos Pasos

1. Instalar dependencias de Neo4j
2. Configurar variables de entorno
3. Implementar `Neo4jSessionRepository`
4. Actualizar router para usar nuevo repository
5. Crear índices en Neo4j
6. Ejecutar tests
7. Migrar datos si es necesario

