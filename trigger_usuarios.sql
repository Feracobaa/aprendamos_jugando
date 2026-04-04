-- Sincronización Automática de Supabase Auth -> public.usuarios
-- Al ejecutar esto, cada vez que crees un usuario en Supabase (Auth), 
-- se creará mágicamente en tu tabla pública 'usuarios' para que no tengas que hacerlo doble.

-- 1. Crear la función del Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (email, nombre, password, role)
  VALUES (
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Nuevo'), 
    'auth_managed', -- La contraseña real ahora vive encriptada en el Auth de Supabase
    COALESCE(new.raw_user_meta_data->>'role', 'estudiante')
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el correo ya existe en public.usuarios, no hacemos nada para evitar errores
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conectar la función a un Trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
