import { NurseSidebar } from "@/components/nurse/nurse-sidebar";
import { NurseTopbar } from "@/components/nurse/nurse-topbar";

export default function NurseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
