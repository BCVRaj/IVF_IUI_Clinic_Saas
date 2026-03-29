import { Button } from "@/components/ui/button";
import { coordinationTasks } from "@/lib/mock-doctor-data";

function TaskCard({
  patient,
  task,
  priority,
  due,
}: {
  patient: string;
  task: string;
  priority: string;
  due: string;
}) {
  return (
    <article className="space-y-4 rounded-lg border-l-4 border-slate-300 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span
          className={`px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
            priority === "Critical"
              ? "bg-rose-100 text-rose-700"
              : priority === "High"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {priority}
        </span>
      </div>
      <div>
        <h5 className="font-bold text-slate-900">{patient}</h5>
        <p className="mt-1 text-xs text-slate-600">{task}</p>
      </div>
      <div className="border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {due}
      </div>
    </article>
  );
}

export default function DoctorNurseCoordinationPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Nurse Coordination</h2>
        <p className="text-sm text-slate-600">Assign and monitor high-priority nursing workflow.</p>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 space-y-6 bg-white p-8 shadow-sm lg:col-span-9">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <select className="rounded bg-slate-100 p-3 text-sm">
              <option>Nurse Elena Rodriguez</option>
              <option>Nurse James Wilson</option>
              <option>Nurse Sarah Chen</option>
            </select>
            <select className="rounded bg-slate-100 p-3 text-sm">
              <option>Patient #8829 - Miller, A.</option>
              <option>Patient #9102 - Tanaka, K.</option>
              <option>Patient #7741 - Smith, L.</option>
            </select>
            <select className="rounded bg-slate-100 p-3 text-sm">
              <option>Ultrasound</option>
              <option>Bloodwork</option>
              <option>Trigger Injection</option>
            </select>
            <input className="rounded bg-slate-100 p-3 text-sm md:col-span-2" type="datetime-local" />
            <Button className="rounded bg-slate-900 hover:bg-slate-800">Assign Task</Button>
          </div>
        </article>

        <article className="col-span-12 flex min-h-[300px] flex-col justify-between border border-slate-200 bg-white p-8 text-slate-900 lg:col-span-3">
          <div>
            <h4 className="text-xl font-bold">Daily Efficiency Report</h4>
            <p className="mt-3 text-sm text-slate-600">
              92% of ultrasound tasks completed within 15 minutes today.
            </p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Active Nurses</p>
              <p className="text-3xl font-bold">14</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Pending</p>
              <p className="text-3xl font-bold text-slate-900">08</p>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-bold tracking-tight">Coordination Board</h3>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending</h4>
              <span className="text-[10px] font-bold text-slate-500">{coordinationTasks.pending.length}</span>
            </div>
            {coordinationTasks.pending.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-teal-700">In Progress</h4>
              <span className="text-[10px] font-bold text-teal-700">{coordinationTasks.progress.length}</span>
            </div>
            {coordinationTasks.progress.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Done</h4>
              <span className="text-[10px] font-bold text-slate-400">{coordinationTasks.done.length}</span>
            </div>
            {coordinationTasks.done.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
