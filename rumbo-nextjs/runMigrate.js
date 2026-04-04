const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Gmv0Zx8TliaCVqvE@db.trshgqkjfwevjeqyaeum.supabase.co:5432/postgres'
});

async function runSQL() {
  await client.connect();
  try {
    console.log("Modificando DB...");
    await client.query(`ALTER TABLE examenes DROP COLUMN IF EXISTS facultad_id;`);
    console.log("Columna facultad_id eliminada de examenes");

    await client.query(`ALTER TABLE usuarios DROP COLUMN IF EXISTS facultad_id;`);
    console.log("Columna facultad_id eliminada de usuarios");

    await client.query(`ALTER TABLE simulacros DROP COLUMN IF EXISTS facultad_id;`);
    console.log("Columna facultad_id eliminada de simulacros");

    await client.query(`ALTER TABLE examenes ADD COLUMN IF NOT EXISTS fase_lectura VARCHAR(50) CHECK (fase_lectura IN ('literal', 'inferencial', 'critico'));`);
    console.log("Columna fase_lectura agregada a examenes");

    await client.query(`DROP TABLE IF EXISTS examenes_facultad CASCADE;`);
    console.log("Tabla examenes_facultad eliminada");

    await client.query(`DROP TABLE IF EXISTS facultad CASCADE;`);
    console.log("Tabla facultad eliminada");

  } catch(e) {
    console.error("Error executing queries", e);
  } finally {
    await client.end();
  }
}

runSQL();
