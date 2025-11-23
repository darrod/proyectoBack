// Script Cypher para crear el schema de la base de datos Neo4j
// Ejecutar este script en Neo4j Browser para visualizar el schema

// Crear nodos de ejemplo para visualización del schema
CREATE (u:Usuario {
  id: 'usr-1',
  email: 'ejemplo@email.com',
  nombre: 'Usuario Ejemplo',
  createdAt: datetime(),
  updatedAt: datetime()
})

CREATE (s:Sesion {
  id: 'ses-1',
  estado: 'planificacion',
  fechaInicio: date('2025-12-10'),
  fechaFin: date('2025-12-20'),
  numeroViajeros: 2,
  tipoExperiencia: 'Aventura',
  esInvitado: false,
  createdAt: datetime(),
  updatedAt: datetime()
})

CREATE (i1:Interes {
  id: 'int-1',
  nombre: 'aventura',
  categoria: 'actividad',
  descripcion: 'Actividades de aventura'
})

CREATE (i2:Interes {
  id: 'int-2',
  nombre: 'gastronomia',
  categoria: 'cultura',
  descripcion: 'Experiencias gastronómicas'
})

CREATE (r1:Restriccion {
  id: 'res-1',
  tipo: 'dietetica',
  descripcion: 'Vegetariano'
})

CREATE (it:Itinerario {
  id: 'iti-1',
  nombre: 'Viaje a los Andes',
  fechaInicio: date('2025-12-10'),
  fechaFin: date('2025-12-20'),
  estado: 'borrador',
  precioTotal: 1500.00,
  createdAt: datetime(),
  updatedAt: datetime()
})

CREATE (e1:Experiencia {
  id: 'exp-1',
  nombre: 'Trekking en los Andes',
  tipo: 'aventura',
  duracion: 5,
  precioBase: 500.00,
  capacidadMaxima: 10,
  descripcion: 'Trekking por los Andes colombianos',
  activa: true
})

CREATE (e2:Experiencia {
  id: 'exp-2',
  nombre: 'Tour Gastronómico',
  tipo: 'cultural',
  duracion: 3,
  precioBase: 300.00,
  capacidadMaxima: 15,
  descripcion: 'Tour gastronómico por la región',
  activa: true
})

CREATE (d1:Destino {
  id: 'des-1',
  nombre: 'Bogotá',
  pais: 'Colombia',
  region: 'Andina',
  coordenadas: point({longitude: -74.0721, latitude: 4.7110}),
  descripcion: 'Capital de Colombia'
})

CREATE (d2:Destino {
  id: 'des-2',
  nombre: 'Medellín',
  pais: 'Colombia',
  region: 'Andina',
  coordenadas: point({longitude: -75.5636, latitude: 6.2476}),
  descripcion: 'Ciudad de la eterna primavera'
})

CREATE (c:Cotizacion {
  id: 'cot-1',
  numero: 'COT-001',
  monto: 1500.00,
  estado: 'pendiente',
  validezHasta: datetime() + duration({days: 30}),
  createdAt: datetime()
})

// Crear relaciones
CREATE (u)-[:CREA {createdAt: datetime()}]->(s)
CREATE (s)-[:TIENE_INTERES]->(i1)
CREATE (s)-[:TIENE_INTERES]->(i2)
CREATE (s)-[:TIENE_RESTRICCION]->(r1)
CREATE (s)-[:GENERA]->(it)
CREATE (u)-[:TIENE]->(it)
CREATE (it)-[:INCLUYE {orden: 1, fecha: date('2025-12-10')}]->(e1)
CREATE (it)-[:INCLUYE {orden: 2, fecha: date('2025-12-15')}]->(e2)
CREATE (it)-[:VISITA {orden: 1}]->(d1)
CREATE (it)-[:VISITA {orden: 2}]->(d2)
CREATE (e1)-[:UBICADA_EN]->(d1)
CREATE (e2)-[:UBICADA_EN]->(d2)
CREATE (e1)-[:RELACIONADA_CON {relevancia: 0.9}]->(i1)
CREATE (e2)-[:RELACIONADA_CON {relevancia: 0.8}]->(i2)
CREATE (e1)-[:COMPATIBLE_CON]->(r1)
CREATE (d1)-[:CONECTA_CON {distancia: 250.5, tiempoEstimado: 360}]->(d2)
CREATE (i1)-[:RELACIONADO_CON {peso: 0.7}]->(i2)
CREATE (it)-[:TIENE]->(c)
CREATE (u)-[:SOLICITA]->(c)

// Visualizar el schema completo
MATCH (n)
RETURN n
LIMIT 50

// O visualizar con relaciones
MATCH path = (n)-[r]->(m)
RETURN path
LIMIT 100

