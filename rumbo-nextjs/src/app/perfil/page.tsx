import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PerfilClient from './PerfilClient'

export const metadata = {
  title: 'Mi Perfil | Aprendamos Jugando',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, email, role, foto_perfil, estado, created_at')
    .eq('email', user.email)
    .single()

  if (!perfil) {
    // Si no encuentra el perfil en la base pública, cerramos la sesión y redirigimos.
    redirect('/login')
  }

  return <PerfilClient perfilInicial={perfil} />
}
