'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Clave o correo incorrecto')
  }

  // Determinar a dónde redirigir según el rol del usuario
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('role')
    .eq('email', data.email)
    .single()

  if (perfil) {
    if (perfil.role === 'admin') {
      revalidatePath('/admin')
      redirect('/admin')
    } else if (perfil.role === 'profesor') {
      revalidatePath('/profesor')
      redirect('/profesor')
    }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
