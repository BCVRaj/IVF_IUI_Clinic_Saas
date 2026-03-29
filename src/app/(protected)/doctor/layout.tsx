"use client";

import { usePathname } from "next/navigation";

import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { DoctorTopbar } from "@/components/doctor/doctor-topbar";

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isEmbryologyDarkRoute =
    pathname.startsWith("/doctor/cryo-inventory") ||
    pathname.startsWith("/doctor/ai-embryo-selection");

  return (
    <div
      className={
        isEmbryologyDarkRoute
          ? "min-h-screen bg-slate-950 text-slate-50"
          : "min-h-screen bg-slate-50 text-slate-900"
      }
    >
      <div className="flex min-h-screen">
        <DoctorSidebar />
        <div className="flex w-full flex-1 flex-col">
          <DoctorTopbar />
          <main className={isEmbryologyDarkRoute ? "bg-slate-950 p-8" : "bg-slate-50 p-8"}>{children}</main>
        </div>
      </div>
    </div>
  );
}
