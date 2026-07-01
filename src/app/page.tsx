import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('USER:', user)

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile && user.email) {
    const { data: fallbackProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', user.email)
      .single()
    profile = fallbackProfile
  }

  const role = profile?.role?.toUpperCase()

  console.log('ROLE:', role)

  if (role === 'PATIENT') {
    redirect('/patient/dashboard')
  } else if (role === 'DOCTOR') {
    redirect('/doctor')
  } else if (role === 'NURSE') {
    redirect('/nurse')
  } else {
    redirect('/login')
  }
}
