const { Client } = require('pg');
const dns = require('dns');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

const client = new Client({
  connectionString: 'postgresql://postgres:Gmv0Zx8TliaCVqvE@db.trshgqkjfwevjeqyaeum.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runSQL() {
  console.log("Conectando a la base de datos...");
  await client.connect();
  console.log("Conexión exitosa!");
  
  try {
    // Check current columns
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'examenes' AND table_schema = 'public' ORDER BY ordinal_position;
    `);
    console.log("Columnas actuales de examenes:", colRes.rows.map(r => r.column_name).join(', '));

    // Add fase_lectura if missing
    const hasFase = colRes.rows.some(r => r.column_name === 'fase_lectura');
    if (!hasFase) {
      await client.query(`
        ALTER TABLE examenes 
        ADD COLUMN fase_lectura VARCHAR(50) 
        CHECK (fase_lectura IN ('literal', 'inferencial', 'critico'));
      `);
      console.log("✅ Columna fase_lectura AGREGADA");
    } else {
      console.log("✅ Columna fase_lectura ya existe");
    }

    // Add publicado if missing
    const hasPub = colRes.rows.some(r => r.column_name === 'publicado');
    if (!hasPub) {
      await client.query(`
        ALTER TABLE examenes 
        ADD COLUMN publicado BOOLEAN DEFAULT true;
      `);
      console.log("✅ Columna publicado AGREGADA");
    } else {
      console.log("✅ Columna publicado ya existe");
    }

    // Verify final state
    const finalRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'examenes' AND table_schema = 'public' ORDER BY ordinal_position;
    `);
    console.log("\nColumnas finales:", finalRes.rows.map(r => r.column_name).join(', '));

  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await client.end();
  }
}

runSQL();
