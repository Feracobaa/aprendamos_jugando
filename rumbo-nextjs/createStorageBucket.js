const { Client } = require('pg');
const dns = require('dns');

// Force IPv4 resolution
dns.setDefaultResultOrder('ipv4first');

const client = new Client({
  connectionString: 'postgresql://postgres:Gmv0Zx8TliaCVqvE@db.trshgqkjfwevjeqyaeum.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false } // Required for Supabase external connections sometimes
});

async function runSQL() {
  console.log("Conectando a la base de datos...");
  await client.connect();
  console.log("Conexión exitosa. Aplicando políticas de Storage...");
  
  try {
    // We can't easily run policies via pg directly if the roles are complex, but let's try opening up the bucket for authenticated users to insert, and public to read.
    const query = `
      -- Permite lectura pública a los objetos del bucket 'imagenes_preguntas'
      CREATE POLICY "Lectura publica imagenes" ON storage.objects
        FOR SELECT USING (bucket_id = 'imagenes_preguntas');

      -- Permite a cualquier usuario autenticado (o anónimo en este caso para probar, pero mejor autenticado) subir archivos
      -- Al ser un entorno de desarrollo simplificado y la app permite a profesores y admins gestionarlo:
      CREATE POLICY "Subida permitida imagenes" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'imagenes_preguntas');

      -- Permitir actualizar
      CREATE POLICY "Actualizacion permitida imagenes" ON storage.objects
        FOR UPDATE USING (bucket_id = 'imagenes_preguntas');

      -- Permitir borrar
      CREATE POLICY "Borrado permitido imagenes" ON storage.objects
        FOR DELETE USING (bucket_id = 'imagenes_preguntas');
    `;
    
    await client.query(query);
    console.log("Políticas aplicadas exitosamente.");

  } catch(e) {
    console.error("Error (pueden ser advertencias si ya existían):", e.message);
  } finally {
    await client.end();
  }
}

runSQL();
