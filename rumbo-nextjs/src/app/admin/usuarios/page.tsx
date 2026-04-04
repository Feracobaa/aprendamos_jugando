import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosClient from './UsuariosClient'

export default async function UsuariosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, email, role, created_at, foto_perfil, estado, last_seen')
    .order('created_at', { ascending: false })

  return <UsuariosClient initialUsuarios={usuarios || []} />
}
