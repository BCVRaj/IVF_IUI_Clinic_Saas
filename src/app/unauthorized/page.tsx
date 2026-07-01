import Link from 'next/link'

export const metadata = {
  title: 'Unauthorized Access | IVF SaaS Platform',
  description: 'You do not have permission to access this portal.',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA] p-4 text-[#0F172A]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 border border-red-100">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3 tracking-tight">Access Denied</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          You do not have the required permissions to view this portal. Please contact your administrator if you believe this is an error, or sign in as a different user.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 rounded-lg bg-[#27257E] text-white font-medium text-sm transition-all duration-200 hover:bg-[#1e1c63] focus:outline-none focus:ring-2 focus:ring-[#27257E]/50 focus:ring-offset-2"
          >
            Switch Account / Sign In
          </Link>
          <Link
            href="/"
            className="block w-full py-2.5 px-4 rounded-lg border border-[#E5E7EB] bg-white text-[#0F172A] font-medium text-sm transition-all duration-200 hover:bg-gray-50"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
