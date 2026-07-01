import { redirect } from 'next/navigation'
import { DoctorSidebar } from '@/components/doctor/doctor-sidebar'
import { DoctorTopbar } from '@/components/doctor/doctor-topbar'
import { createClient } from '@/lib/supabase/server'

export default async function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  if (role !== 'doctor') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <DoctorSidebar />
        <div className="flex w-full flex-1 flex-col">
          <DoctorTopbar />
          <main className="bg-slate-50 p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
