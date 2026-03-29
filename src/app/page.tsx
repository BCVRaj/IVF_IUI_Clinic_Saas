export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <main className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          IVF SaaS Platform Skeleton Initialized
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Protected workspaces are ready at /patient, /nurse, and /doctor.
        </p>
      </main>
    </div>
  );
}
