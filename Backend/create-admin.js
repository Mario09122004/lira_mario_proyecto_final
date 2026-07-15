import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin@postgres:5432/MuseoFranciscoVilla'
});

async function run() {
  try {
    await client.connect();
    const email = 'admin@gmail.com';
    const password = 'admin';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await client.query('DELETE FROM "Usuarios".cuentas WHERE correo = $1', [email]);
    await client.query('INSERT INTO "Usuarios".cuentas (nombre, correo, contrasena) VALUES ($1, $2, $3)', ['Administrador', email, hash]);
    console.log(`Usuario administrador creado con éxito: ${email} / ${password}`);
  } catch (err) {
    console.error('Error al crear usuario:', err);
  } finally {
    await client.end();
  }
}

run();
