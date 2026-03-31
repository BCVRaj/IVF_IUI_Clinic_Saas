"use client";

import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { DoctorTopbar } from "@/components/doctor/doctor-topbar";

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
