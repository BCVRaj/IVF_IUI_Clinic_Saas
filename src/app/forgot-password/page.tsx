import Image from 'next/image'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Forgot Password | IVF SaaS Platform',
  description: 'Reset your IVF SaaS Platform account password',
}

export default function ForgotPasswordPage() {
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
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
