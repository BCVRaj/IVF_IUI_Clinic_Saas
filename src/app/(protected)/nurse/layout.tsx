import { redirect } from 'next/navigation'
import { NurseSidebar } from '@/components/nurse/nurse-sidebar'
import { NurseTopbar } from '@/components/nurse/nurse-topbar'
import { createClient } from '@/lib/supabase/server'

export default async function NurseLayout({
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

  if (role !== 'nurse') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NurseTopbar />
      <div className="flex w-full">
        <NurseSidebar />
        <main className="w-full px-6 pb-10 pt-20 md:px-8">{children}</main>
      </div>
    </div>
  );
}
