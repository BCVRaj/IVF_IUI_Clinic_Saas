import { Button } from "@/components/ui/button";
import {
  doctorAlerts,
  doctorSchedule,
  doctorStats,
} from "@/lib/mock-doctor-data";

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-10 bg-slate-50 text-slate-900">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clinical Overview</h2>
        <p className="text-sm text-slate-600">Tuesday, Oct 24 • Laboratory Operations Active</p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {doctorStats.map((stat) => (
          <article
            key={stat.id}
            className={`min-h-[130px] p-6 ${
              stat.tone === "red"
                ? "bg-rose-100"
                : stat.tone === "dark"
                  ? "bg-white text-slate-900"
                  : "bg-white"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-75">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-extrabold tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold">{stat.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Today&apos;s Patient Schedule</h3>
            <div className="flex gap-2">
              <Button variant="secondary" className="rounded-none text-xs uppercase">
                Filter
              </Button>
              <Button className="rounded-none bg-teal-700 text-xs uppercase hover:bg-teal-600">
                Add Record
              </Button>
            </div>
          </div>

          <div className="overflow-hidden bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Cycle Day</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Last Scan</th>
                  <th className="px-6 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorSchedule.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <p className="font-bold">{row.name}</p>
                      <p className="text-xs text-slate-500">ID: {row.id}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-900">{row.cycleDay}</td>
                    <td className="px-6 py-5">
                      <span className="bg-teal-100 px-2 py-1 text-[10px] font-bold uppercase text-teal-800">
                        {row.stage}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{row.lastScan}</td>
                    <td className="px-6 py-5 text-right">
                      <button className="border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 hover:text-slate-900">
                        Open EHR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <h3 className="text-xl font-bold">Critical Alerts</h3>
          {doctorAlerts.map((alert) => (
            <article
              key={alert.id}
              className={`border-l-4 p-5 ${
                alert.severity === "critical" ? "border-red-600 bg-white" : "border-[#600007] bg-white"
              }`}
            >
              <p className="text-xs font-extrabold uppercase tracking-widest text-red-700">
                {alert.title}
              </p>
              <p className="mt-1 font-bold text-slate-900">{alert.patient}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{alert.message}</p>
            </article>
          ))}
        </aside>
      </section>
    </div>
  );
}
