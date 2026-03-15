import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running manual migration to add deleted_at columns...');
    
    const tables = [
      'classes',
      'class_schedule_slots',
      'class_occurrences',
      'attendance',
      'tasks',
      'exams',
      'files',
      'semesters',
      'non_academic_events'
    ];

    for (const table of tables) {
      console.log(`Adding deleted_at to ${table}...`);
      await client.query(`
        ALTER TABLE ${table}
        ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
      `);
      console.log(`Success: ${table}`);
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
