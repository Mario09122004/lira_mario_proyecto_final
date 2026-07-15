/*
node create-admin.js
# Imprimió: Usuario administrador creado con éxito: admin@gmail.com / admin
*/

const path = require('path');
const dotenv = require(path.join(__dirname, 'Backend', 'node_modules', 'dotenv'));
const pg = require(path.join(__dirname, 'Backend', 'node_modules', 'pg'));
const bcrypt = require(path.join(__dirname, 'Backend', 'node_modules', 'bcryptjs'));

dotenv.config({ path: path.join(__dirname, 'Backend', '.env') });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin@localhost:5432/MuseoFranciscoVilla'
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
