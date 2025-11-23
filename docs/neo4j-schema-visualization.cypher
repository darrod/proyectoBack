// Query para visualizar el schema completo en Neo4j Browser
// Este query muestra todos los nodos y relaciones del modelo

// Opción 1: Visualizar todo el grafo
MATCH (n)
OPTIONAL MATCH (n)-[r]->(m)
RETURN n, r, m

// Opción 2: Visualizar solo el schema (sin datos, solo estructura)
// Primero crear índices y constraints para documentar el schema
CREATE INDEX usuario_id IF NOT EXISTS FOR (u:Usuario) ON (u.id);
CREATE INDEX sesion_id IF NOT EXISTS FOR (s:Sesion) ON (s.id);
CREATE INDEX interes_nombre IF NOT EXISTS FOR (i:Interes) ON (i.nombre);
CREATE INDEX restriccion_tipo IF NOT EXISTS FOR (r:Restriccion) ON (r.tipo);
CREATE INDEX experiencia_id IF NOT EXISTS FOR (e:Experiencia) ON (e.id);
CREATE INDEX destino_id IF NOT EXISTS FOR (d:Destino) ON (d.id);
CREATE INDEX itinerario_id IF NOT EXISTS FOR (it:Itinerario) ON (it.id);
CREATE INDEX cotizacion_id IF NOT EXISTS FOR (c:Cotizacion) ON (c.id);

// Constraints para garantizar unicidad
CREATE CONSTRAINT usuario_id_unique IF NOT EXISTS
FOR (u:Usuario) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT sesion_id_unique IF NOT EXISTS
FOR (s:Sesion) REQUIRE s.id IS UNIQUE;

// Query para ver el schema de relaciones
CALL db.schema.visualization()

// O query personalizado para ver todas las relaciones
MATCH (a)-[r]->(b)
RETURN DISTINCT 
  labels(a)[0] AS from,
  type(r) AS relationship,
  labels(b)[0] AS to
ORDER BY from, relationship, to

