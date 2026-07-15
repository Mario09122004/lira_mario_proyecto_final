/*
node generate-data.js
# Imprimió:
# Conectado a la base de datos para generar datos ficticios...
# Tabla de registros limpia.
# ¡Se han generado con éxito 80 registros de visitantes ficticios!
*/

const path = require('path');
const dotenv = require(path.join(__dirname, 'Backend', 'node_modules', 'dotenv'));
const pg = require(path.join(__dirname, 'Backend', 'node_modules', 'pg'));

dotenv.config({ path: path.join(__dirname, 'Backend', '.env') });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/MuseoFranciscoVilla'
});

const NAMES = [
  "Juan Pérez", "María López", "John Smith", "Alice Johnson", "Carlos García",
  "Ana Martínez", "Robert Davis", "Emily Wilson", "Luis Rodríguez", "Sofia Hernandez",
  "David Brown", "Emma Miller", "Jorge Sánchez", "Laura Ramirez", "James Taylor",
  "Olivia Thomas", "Pedro Gomez", "Diana Torres", "William White", "Sophia Harris"
];

const STATES = [
  "Chihuahua", "Coahuila", "Sinaloa", "Jalisco", "Ciudad de México", 
  "Nuevo León", "Zacatecas", "Yucatán", "Querétaro", "San Luis Potosí"
];

const MUNICIPALITIES = [
  "Durango", "Gómez Palacio", "Lerdo", "Pueblo Nuevo", "Santiago Papasquiaro", 
  "Mezquital", "Canatlán", "Guadalupe Victoria", "Nombre de Dios", "Vicente Guerrero"
];

const COUNTRIES = [
  "Canadá", "Estados Unidos", "España", "Colombia", "Francia", "Alemania", "Japón"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  try {
    await client.connect();
    console.log("Conectado a la base de datos para generar datos ficticios...");

    // Limpiar tabla antes de rellenar
    await client.query('DELETE FROM visitantes.registro');
    console.log("Tabla de registros limpia.");

    // Generar 80 registros distribuidos en los últimos 90 días
    for (let i = 1; i <= 80; i++) {
      const folio = `F-${getRandomInt(10000, 99999)}`;
      const name = getRandomItem(NAMES);
      
      // Personas
      const numPersonas = getRandomInt(1, 6);
      
      // Desglose género
      const hombres = getRandomInt(0, numPersonas);
      const mujeres = numPersonas - hombres;

      // Desglose edad
      let remaining = numPersonas;
      const ninos = getRandomInt(0, remaining);
      remaining -= ninos;
      
      const jovenes = getRandomInt(0, remaining);
      remaining -= jovenes;
      
      const adultos = getRandomInt(0, remaining);
      remaining -= adultos;
      
      const tercera_edad = remaining;

      // Procedencia
      const tipo = getRandomItem(['Local', 'Nacional', 'Internacional']);
      let procedencia = 'Durango';
      let municipio = null;

      if (tipo === 'Local') {
        procedencia = 'Durango';
        municipio = getRandomItem(MUNICIPALITIES);
      } else if (tipo === 'Nacional') {
        procedencia = getRandomItem(STATES);
      } else {
        procedencia = getRandomItem(COUNTRIES);
      }

      // Fecha aleatoria de los últimos 90 días
      const daysAgo = getRandomInt(0, 90);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(getRandomInt(9, 18), getRandomInt(0, 59), 0, 0); // Horario laboral del museo

      await client.query(
        `INSERT INTO visitantes.registro 
        (folio_boleto, nombre_visitante, num_personas, hombres, mujeres, ninos, jovenes, adultos, tercera_edad, tipo_procedencia, procedencia, municipio, fecha)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [folio, name, numPersonas, hombres, mujeres, ninos, jovenes, adultos, tercera_edad, tipo, procedencia, municipio, date]
      );
    }

    console.log("¡Se han generado con éxito 80 registros de visitantes ficticios!");
  } catch (err) {
    console.error("Error al generar los datos:", err);
  } finally {
    await client.end();
  }
}

run();
