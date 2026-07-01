import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LogoutPage() {
  const supabase = await createClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout page error:', error)
  }

  redirect('/login')
}
