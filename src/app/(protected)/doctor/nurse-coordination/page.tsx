"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { coordinationTasks } from "@/lib/mock-doctor-data";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

function TaskCard({
  id,
  patientId,
  patientName,
  task,
  priority,
  due,
  assignedNurse,
  acknowledged,
  acknowledgmentTime,
  status,
  createdBy,
}: {
  id: string;
  patientId: string;
  patientName: string;
  task: string;
  priority: string;
  due: string;
  assignedNurse: string;
  acknowledged: boolean;
  acknowledgmentTime: string | null;
  status: string;
  createdBy: string;
}) {
  return (
    <article className="space-y-4 rounded-lg border-l-4 border-primary bg-surface-lowest p-5 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full ${
              priority === "Critical"
                ? "bg-error/20 text-error"
                : priority === "High"
                  ? "bg-secondary/20 text-secondary"
                  : "bg-surface/50 text-on-surface-variant"
            }`}
          >
            {priority}
          </span>
          {acknowledged && (
            <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
          )}
        </div>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {patientId}
        </span>
      </div>
      <div>
        <h5 className="font-bold text-on-surface">{patientName}</h5>
        <p className="mt-2 text-sm text-on-surface-variant">{task}</p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Assigned to: <span className="font-semibold text-on-surface">{assignedNurse}</span>
        </p>
      </div>
      <div className="border-t border-surface-low pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <Clock className="size-3.5" />
            {due}
          </div>
          {acknowledged && (
            <span className="text-xs font-semibold text-green-700">
              Acknowledged {acknowledgmentTime}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// Nurse and patient mappings for UI
const NURSES = [
  { id: "nurse_001", name: "Nurse Elena Rodriguez" },
  { id: "nurse_002", name: "Nurse James Wilson" },
  { id: "nurse_003", name: "Nurse Sarah Chen" },
];

const PATIENTS = [
  { id: "patient_001", name: "Patient #8829 - Miller, A." },
  { id: "patient_002", name: "Patient #9102 - Tanaka, K." },
  { id: "patient_003", name: "Patient #7741 - Smith, L." },
];

const TASK_TYPES = [
  { id: "hcg_injection", name: "Oocyte Trigger Injection - HCG" },
  { id: "bloodwork", name: "Bloodwork Collection" },
  { id: "ultrasound", name: "Ultrasound Assessment" },
];

export default function DoctorNurseCoordinationPage() {
  const [selectedNurse, setSelectedNurse] = useState("nurse_001");
  const [selectedPatient, setSelectedPatient] = useState("patient_001");
  const [selectedTask, setSelectedTask] = useState("hcg_injection");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAssignTask = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!selectedNurse || !selectedPatient || !selectedTask || !dueDate) {
        setErrorMessage("Please fill in all fields");
        return;
      }

      const response = await fetch("/api/doctor/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          assignedToNurseId: selectedNurse,
          title: TASK_TYPES.find((t) => t.id === selectedTask)?.name || "Task",
          taskType: selectedTask,
          priority: "HIGH",
          dueDate: dueDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign task");
      }

      const data = await response.json();
      setSuccessMessage("✅ Task assigned successfully!");
      
      // Reset form
      setSelectedNurse("nurse_001");
      setSelectedPatient("patient_001");
      setSelectedTask("hcg_injection");
      setDueDate("");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage("❌ " + (err.message || "Error assigning task"));
    } finally {
      setIsLoading(false);
    }
  };

  const allTasks = [
    ...coordinationTasks.pending,
    ...coordinationTasks.progress,
    ...coordinationTasks.done
  ];

  const pendingCount = coordinationTasks.pending.length;
  const progressCount = coordinationTasks.progress.length;
  const doneCount = coordinationTasks.done.length;
  const acknowledgedCount = allTasks.filter((t: any) => t.acknowledged).length;

  return (
    <div className="space-y-8 bg-background text-on-surface">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">
          Nurse Coordination
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Assign and monitor high-priority nursing workflow with real-time acknowledgment tracking.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border-l-[3px] border-primary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Total Assigned
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-primary">{allTasks.length}</p>
          </div>
        </article>
        <article className="rounded-xl border-l-[3px] border-secondary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Pending
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-secondary">{pendingCount}</p>
          </div>
        </article>
        <article className="rounded-xl border-l-[3px] border-tertiary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            In Progress
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-tertiary">{progressCount}</p>
          </div>
        </article>
        <article className="rounded-xl border-l-[3px] border-green-600 bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Acknowledged
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-green-600">{acknowledgedCount}</p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 space-y-6 bg-surface-lowest p-8 shadow-[0_8px_32px_rgba(25,28,30,0.04)] lg:col-span-9 backdrop-blur-md rounded-xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <select 
              value={selectedNurse}
              onChange={(e) => setSelectedNurse(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              {NURSES.map((nurse) => (
                <option key={nurse.id} value={nurse.id}>
                  {nurse.name}
                </option>
              ))}
            </select>
            <select 
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              {PATIENTS.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <select 
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              {TASK_TYPES.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
            <input 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" 
              type="datetime-local" 
              placeholder="Set deadline"
            />
            <Button 
              onClick={handleAssignTask}
              disabled={isLoading}
              className="rounded-lg bg-gradient-to-r from-primary to-primary-container text-primary-foreground hover:opacity-90 shadow-none font-bold uppercase text-xs tracking-wider disabled:opacity-50"
            >
              {isLoading ? "Assigning..." : "Assign Task"}
            </Button>
          </div>

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-100 text-green-800 text-sm font-semibold">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-100 text-red-800 text-sm font-semibold">
              {errorMessage}
            </div>
          )}
        </article>

        <article className="col-span-12 flex min-h-[300px] flex-col justify-between bg-surface-lowest p-8 text-on-surface lg:col-span-3 rounded-xl shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
          <div>
            <h4 className="text-xl font-bold text-primary">Coordination Status</h4>
            <p className="mt-3 text-sm text-on-surface-variant">
              {acknowledgedCount} out of {allTasks.length} tasks have been acknowledged by assigned nurses.
              <br />
              <span className="font-semibold text-on-surface">
                {Math.round((acknowledgedCount / allTasks.length) * 100)}% acknowledgment rate
              </span>
            </p>
          </div>
          <div className="flex justify-between pt-4 border-t border-surface-low">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active Nurses</p>
              <p className="text-3xl font-black text-primary">3</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Awaiting ACK</p>
              <p className="text-3xl font-black text-error">{allTasks.length - acknowledgedCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-primary" />
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Coordination Board</h3>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pending</h4>
              <span className="inline-block px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold">
                {coordinationTasks.pending.length}
              </span>
            </div>
            {coordinationTasks.pending.map((task: any) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary">In Progress</h4>
              <span className="inline-block px-2 py-1 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold">
                {coordinationTasks.progress.length}
              </span>
            </div>
            {coordinationTasks.progress.map((task: any) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-green-700">Completed</h4>
              <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                {coordinationTasks.done.length}
              </span>
            </div>
            {coordinationTasks.done.map((task: any) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
