import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface flex flex-col p-4 sm:p-8 md:p-12 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-secondary-container opacity-20 blur-3xl mix-blend-multiply"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] rounded-full bg-primary-container opacity-10 blur-3xl mix-blend-multiply"></div>

      <main className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center flex-grow relative z-10 py-12">
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary mb-6 tracking-tight display-font">
            IVF SaaS Platform
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-3xl mx-auto">
            Welcome to the centralized clinical management system. Please select your designated portal to continue to your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full">
          {/* Patient Portal Card */}
          <Link href="/patient" className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-surface-lowest shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden border border-surface-variant/30">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Patient Portal</h2>
            <p className="text-on-surface-variant text-lg mb-10 flex-grow leading-relaxed">
              Access your treatment plans, view test results, and communicate securely with your care team.
            </p>
            <div className="text-secondary font-semibold flex items-center group-hover:translate-x-2 transition-transform duration-300 text-lg">
              Enter Portal
              <svg className="w-6 h-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>

          {/* Nurse Portal Card */}
          <Link href="/nurse" className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-surface-lowest shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden border border-surface-variant/30">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-green-50 flex items-center justify-center mb-8 text-green-600 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Nurse Portal</h2>
            <p className="text-on-surface-variant text-lg mb-10 flex-grow leading-relaxed">
              Manage patient schedules, record clinical vitals, and coordinate daily treatment routines.
            </p>
            <div className="text-secondary font-semibold flex items-center group-hover:translate-x-2 transition-transform duration-300 text-lg">
              Enter Portal
              <svg className="w-6 h-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>

          {/* Doctor Portal Card */}
          <Link href="/doctor" className="group flex flex-col p-8 md:p-10 rounded-[2rem] bg-surface-lowest shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden border border-surface-variant/30">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-8 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.95 11.95 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Doctor Portal</h2>
            <p className="text-on-surface-variant text-lg mb-10 flex-grow leading-relaxed">
              Review diagnostic imaging, prescribe protocols, and oversee all IVF cycle progress.
            </p>
            <div className="text-secondary font-semibold flex items-center group-hover:translate-x-2 transition-transform duration-300 text-lg">
              Enter Portal
              <svg className="w-6 h-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
