'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

function slugify(text: string) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export async function joinPlatform(prevState: any, formData: FormData) {
  const nombre = formData.get('nombre') as string
  const codigo = formData.get('codigo') as string

  if (!nombre || nombre.trim().length < 3) {
    return { error: 'Por favor, ingresa tu nombre completo (mínimo 3 letras).' }
  }

  if (!codigo || codigo.trim() === '') {
    return { error: 'Por favor, ingresa el código de acceso.' }
  }

  const globalCode = process.env.NEXT_PUBLIC_CLASS_CODE || 'RUMBO2026'

  if (codigo.trim().toUpperCase() !== globalCode.toUpperCase()) {
    return { error: 'Código de acceso incorrecto. Verifica e intenta de nuevo.' }
  }

  const nombreLimpio = nombre.trim()
  const slug = slugify(nombreLimpio)
  // Generamos un email determinista único para este estudiante y clase
  const email = `${slug}_${globalCode.toLowerCase()}@estudiante.rumbo.local`
  const password = `Rumbo_${globalCode}!` 

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Intentar iniciar sesión primero (por si ya existe)
  let authRes = await supabase.auth.signInWithPassword({
    email,
    password
  })

  // 2. Si falla el inicio de sesión por credenciales inválidas, creamos la cuenta
  if (authRes.error && authRes.error.message.includes('Invalid login credentials')) {
    
    // Crear el usuario en auth.users saltando la confirmación de correo
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: nombreLimpio }
    })

    if (createError) {
      console.error('Error creando cuenta sombra:', createError)
      return { error: 'Error al inicializar tu cuenta. Intenta de nuevo.' }
    }

    // Insertar el perfil en public.usuarios
    if (newUser.user) {
      const { error: dbError } = await adminClient.from('usuarios').insert({
        id: newUser.user.id,
        email: email,
        nombre: nombreLimpio,
        role: 'estudiante'
      })

      if (dbError) {
        console.error('Error insertando perfil sombra en DB:', dbError)
      }
    }

    // Iniciar sesión con la cuenta recién creada
    authRes = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authRes.error) {
       console.error('Error signIn tras crear:', authRes.error)
       return { error: 'No se pudo iniciar tu sesión automáticamente.' }
    }
  } else if (authRes.error) {
    console.error('Error Auth inesperado:', authRes.error)
    return { error: 'Error de servidor. Intenta de nuevo más tarde.' }
  }

  redirect('/dashboard')
}
