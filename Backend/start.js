import { execSync } from 'child_process';
import pg from 'pg';

const { Client } = pg;

async function waitForDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://admin:admin@postgres:5432/MuseoFranciscoVilla';
  let retries = 20;
  
  while (retries > 0) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      // Test if table or schema exists, or just check connectivity
      await client.query('SELECT 1');
      await client.end();
      console.log('Database is ready! Running migrations and seeding...');
      return;
    } catch (err) {
      console.log(`Database is not ready yet (${err.message}). Retrying in 2 seconds... (${retries} retries left)`);
      retries -= 1;
      try {
        await client.end();
      } catch (e) {
        // Ignore end error if not connected
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Database was not ready in time.');
}

async function main() {
  try {
    // Wait for PG to start
    await waitForDb();
    
    // Run create-admin
    console.log('--- Seeding administrator account ---');
    execSync('node create-admin.js', { stdio: 'inherit' });
    
    // Run generate-data
    console.log('--- Generating sample visitor data ---');
    execSync('node generate-data.js', { stdio: 'inherit' });
    
    // Start backend application
    console.log('--- Starting API Server ---');
    execSync('node src/index.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Startup script failed:', err);
    process.exit(1);
  }
}

main();
