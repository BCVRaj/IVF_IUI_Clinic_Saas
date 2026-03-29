import { PatientSidebar } from "@/components/patient/patient-sidebar";
import { PatientTopbar } from "@/components/patient/patient-topbar";

export default function PatientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PatientTopbar />
      <div className="mx-auto flex max-w-screen-2xl">
        <PatientSidebar />
        <main className="w-full px-4 pb-12 pt-24 md:pl-8 md:pr-10">{children}</main>
      </div>
    </div>
  );
}
