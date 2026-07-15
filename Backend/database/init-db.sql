-- Script de inicialización de Base de Datos para el Museo Francisco Villa

-- NOTA: Si ejecuta este script manualmente en su gestor de bases de datos (como pgAdmin o psql),
-- asegúrese primero de crear la base de datos "MuseoFranciscoVilla" y conectarse a ella.
-- CREATE DATABASE "MuseoFranciscoVilla";

CREATE SCHEMA IF NOT EXISTS "Usuarios";
CREATE SCHEMA IF NOT EXISTS visitantes;

-- Tabla de Cuentas de Usuario para el Login/Administración
CREATE TABLE IF NOT EXISTS "Usuarios".cuentas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Registro de Visitantes
CREATE TABLE IF NOT EXISTS visitantes.registro (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    folio_boleto VARCHAR(50) NOT NULL,
    nombre_visitante VARCHAR(150) NOT NULL,
    num_personas INTEGER NOT NULL,
    hombres INTEGER NOT NULL,
    mujeres INTEGER NOT NULL,
    ninos INTEGER NOT NULL,
    jovenes INTEGER NOT NULL,
    adultos INTEGER NOT NULL,
    tercera_edad INTEGER NOT NULL,
    tipo_procedencia VARCHAR(50) NOT NULL, -- 'Local', 'Nacional', 'Internacional'
    procedencia VARCHAR(150) NOT NULL, -- Estado (ej. 'Durango') o País (ej. 'Canadá')
    municipio VARCHAR(150) DEFAULT NULL -- Municipio (solo si tipo_procedencia = 'Local' y procedencia = 'Durango')
);

-- Insertar usuario semilla administrador por defecto:
-- Usuario/Correo: admin@gmail.com
-- Contraseña original: admin (Cifrado bcrypt: $2b$10$B6qcLvPDb3i2WnZH1V75VeVjrZn7ZYl2jnGCNFdBtxR/sUJvRiB36)
INSERT INTO "Usuarios".cuentas (nombre, correo, contrasena)
VALUES ('Administrador', 'admin@gmail.com', '$2b$10$B6qcLvPDb3i2WnZH1V75VeVjrZn7ZYl2jnGCNFdBtxR/sUJvRiB36')
ON CONFLICT (correo) DO NOTHING;
