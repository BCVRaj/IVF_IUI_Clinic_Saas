import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { appointmentTimeSlots, pastAppointments } from "@/lib/mock-patient-data";

const calendarDays = [
  [29, 30, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, 1, 2],
];

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Schedule Your Visit</h1>
        <p className="mt-2 text-slate-600">
          Select a date and time that feels right for your next appointment.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <article className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-emerald-800">October 2026</h2>
            <div className="flex gap-2">
              <button className="rounded-full p-2 hover:bg-slate-100">
                <ChevronLeft className="size-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-slate-100">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {"SMTWTFS".split("").map((d) => (
              <p key={d} className="py-2 font-bold text-slate-500">
                {d}
              </p>
            ))}
            {calendarDays.flatMap((week, wi) =>
              week.map((day, di) => {
                const selected = wi === 2 && di === 2;
                const available = [2, 7, 8, 16, 23].includes(day);
                return (
                  <div
                    key={`${wi}-${di}`}
                    className={`rounded-lg py-3 font-semibold ${
                      selected
                        ? "bg-emerald-700 text-white"
                        : available
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-slate-700"
                    }`}
                  >
                    {day}
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Choose Doctor
                </label>
                <select className="w-full rounded-lg bg-slate-100 p-3 text-sm">
                  <option>Dr. Miller - REI specialist</option>
                  <option>Dr. Jenkins - Ultrasound Tech</option>
                  <option>Dr. Sarah - Embryologist</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Appointment Type
                </label>
                <div className="flex rounded-full bg-slate-100 p-1">
                  <button className="flex-1 rounded-full bg-white py-2 text-sm font-bold text-emerald-700 shadow">
                    Scan
                  </button>
                  <button className="flex-1 py-2 text-sm font-semibold text-slate-500">
                    Procedure
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Available Times (October 15)
              </label>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {appointmentTimeSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`rounded-lg px-2 py-3 text-sm font-semibold ${
                      slot === "09:00 AM"
                        ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300"
                        : "bg-slate-100 text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
                <button className="cursor-not-allowed rounded-lg bg-slate-100 py-3 text-xs italic text-slate-400">
                  Booked
                </button>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-slate-100 p-3 text-sm"
                placeholder="Any specific concerns or symptoms you would like to discuss..."
              />
            </div>
          </div>

          <Button className="w-full rounded-full bg-emerald-700 py-6 text-base hover:bg-emerald-600">
            <CalendarDays className="size-4" />
            Confirm Appointment
          </Button>
        </article>
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold text-slate-900">Past Appointments</h2>
        <div className="space-y-3">
          {pastAppointments.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-lg font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.date} · {item.doctor}
                </p>
              </div>
              <StatusBadge
                label={item.status}
                tone={item.status === "Completed" ? "success" : "danger"}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
