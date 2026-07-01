import { Suspense } from 'react'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In | IVF SaaS Platform',
  description: 'Sign in to your IVF SaaS Platform account',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
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

    if (role === 'patient') {
      redirect('/patient/dashboard')
    }
    if (role === 'doctor') {
      redirect('/doctor')
    }
    if (role === 'nurse') {
      redirect('/nurse')
    }

    redirect('/login')
  }

  const logoutSuccess =
    searchParams.loggedOut === '1' || searchParams.loggedOut === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] p-4">
      <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-lg overflow-hidden flex">
        {/* Left — Illustration */}
        <div className="hidden md:flex md:w-1/2 bg-[#F0F1F6] items-center justify-center p-8">
          <Image
            src="/sign-in.png"
            alt="Medical illustration"
            width={360}
            height={360}
            className="object-contain max-h-[360px] w-auto"
            priority
          />
        </div>

        {/* Right — Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-10">
          {logoutSuccess ? (
            <div className="mb-6 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
              Successfully signed out.
            </div>
          ) : null}
          <Suspense fallback={
            <div className="flex items-center justify-center w-full py-12">
              <svg className="animate-spin h-6 w-6 text-[#27257E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
