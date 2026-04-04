'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function registrarEstudiante(formData: FormData) {
  const supabase = await createClient()

  const nombre = (formData.get('nombre') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const confirmar = formData.get('confirmar_password') as string


  if (!nombre || !email || !password) {
    redirect('/registro?error=Todos los campos son obligatorios.')
  }

  if (password.length < 6) {
    redirect('/registro?error=La contraseña debe tener al menos 6 caracteres.')
  }

  if (password !== confirmar) {
    redirect('/registro?error=Las contraseñas no coinciden.')
  }

  // Crear usuario en Supabase Auth con role fijo = "estudiante"
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        role: 'estudiante', // SIEMPRE estudiante en el registro público
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      redirect('/registro?error=Este correo ya está registrado. Intenta iniciar sesión.')
    }
    redirect(`/registro?error=${encodeURIComponent(authError.message)}`)
  }



  redirect('/registro?ok=¡Cuenta creada! Ahora inicia sesión con tus credenciales.')
}
