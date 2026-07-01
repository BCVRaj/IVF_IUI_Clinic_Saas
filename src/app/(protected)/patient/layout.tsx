import { redirect } from 'next/navigation'
import { PatientSidebar } from '@/components/patient/patient-sidebar'
import { PatientTopbar } from '@/components/patient/patient-topbar'
import { createClient } from '@/lib/supabase/server'

export default async function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('USER:', user)

  if (!user) {
    redirect('/login')
  }

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

  const role = profile?.role?.toLowerCase()

  console.log('ROLE:', role)

  if (role !== 'patient') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PatientTopbar />
      <div className="flex w-full">
        <PatientSidebar />
        <main className="w-full px-6 pb-12 pt-20 md:px-8">{children}</main>
      </div>
    </div>
  )
}
