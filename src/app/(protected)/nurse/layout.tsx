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
      <div className="mx-auto flex max-w-screen-2xl">
        <NurseSidebar />
        <main className="w-full px-4 pb-10 pt-20 md:px-8">{children}</main>
      </div>
    </div>
  );
}
