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
      <div className="flex w-full">
        <PatientSidebar />
        <main className="w-full px-6 pb-12 pt-20 md:px-8">{children}</main>
      </div>
    </div>
  );
}
