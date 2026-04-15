"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

type NurseOption = { id: string; name: string };
type PatientOption = { id: string; name: string };
type NurseResponse = { id: string; first_name?: string | null; last_name?: string | null };
type PatientResponse = { id: string; first_name?: string | null; last_name?: string | null };
type ApiTask = {
  id: string;
  patient_id: string;
  assigned_to: string;
  created_by: string;
  title: string;
  description?: string | null;
  task_type: string;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  acknowledged?: boolean | null;
  acknowledged_at?: string | null;
  patient?: PatientResponse;
  nurse?: NurseResponse;
  patients?: PatientResponse;
  user_profiles?: NurseResponse;
};
type CoordinationTask = {
  id: string;
  patientId: string;
  patientName: string;
  task: string;
  priority: string;
  due: string;
  assignedNurse: string;
  assignedNurseId: string;
  status: string;
  createdBy: string;
  acknowledged: boolean;
  acknowledgmentTime: string | null;
};

const TASK_TYPES = [
  { id: "MEDICATION", name: "Oocyte Trigger Injection - HCG" },
  { id: "MONITORING", name: "Bloodwork & Monitoring" },
  { id: "PROCEDURE", name: "Ultrasound Assessment" },
  { id: "COMMUNICATION", name: "Patient Communication" },
  { id: "FOLLOWUP", name: "Follow-up Check" },
];

const formatName = (first?: string | null, last?: string | null, fallback = "") => {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full || fallback;
};

const formatDue = (value?: string | null) => {
  if (!value) return "No due date";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  } catch (_) {
    return value;
  }
};

const normalizePriority = (value?: string | null) => {
  const upper = (value || "").toUpperCase();
  if (upper === "CRITICAL") return "Critical";
  if (upper === "HIGH") return "High";
  return "Normal";
};

function TaskCard({
  patientId,
  patientName,
  task,
  priority,
  due,
  assignedNurse,
  acknowledged,
  acknowledgmentTime,
}: CoordinationTask) {
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

export default function DoctorNurseCoordinationPage() {
  const [nurses, setNurses] = useState<NurseOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [tasks, setTasks] = useState<CoordinationTask[]>([]);
  const [selectedNurse, setSelectedNurse] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTask, setSelectedTask] = useState("MEDICATION");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadOptions = useCallback(async () => {
    try {
      setErrorMessage("");

      const [nurseRes, patientRes] = await Promise.all([
        fetch("/api/staff/nurses"),
        fetch("/api/doctor/patients"),
      ]);

      if (!nurseRes.ok) {
        throw new Error("Failed to load nurses");
      }
      if (!patientRes.ok) {
        throw new Error("Failed to load patients");
      }

      const nurseJson: { data?: NurseResponse[] } = await nurseRes.json();
      const patientJson: { data?: PatientResponse[] } = await patientRes.json();

      const nurseOptions: NurseOption[] = (nurseJson.data || []).map((n) => ({
        id: n.id,
        name: formatName(n.first_name, n.last_name, n.id),
      }));

      const patientOptions: PatientOption[] = (patientJson.data || []).map((p) => ({
        id: p.id,
        name: formatName(p.first_name, p.last_name, p.id),
      }));

      setNurses(nurseOptions);
      setPatients(patientOptions);

      if (nurseOptions.length > 0) setSelectedNurse(nurseOptions[0].id);
      if (patientOptions.length > 0) setSelectedPatient(patientOptions[0].id);
    } catch (err: unknown) {
      console.error("Failed to load options", err);
      setErrorMessage(
        "Could not load nurses/patients. Please try again or add sample data."
      );
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const res = await fetch("/api/doctor/tasks");
      if (!res.ok) {
        throw new Error("Failed to load tasks");
      }
      const json: { data?: ApiTask[] } = await res.json();
      const items: CoordinationTask[] = (json.data || []).map((t) => {
        const patient = t.patient || t.patients;
        const nurse = t.nurse || t.user_profiles;
        return {
          id: t.id,
          patientId: patient?.id || t.patient_id,
          patientName: formatName(patient?.first_name, patient?.last_name, t.patient_id || "Patient"),
          task: t.title || t.task_type || "Task",
          priority: normalizePriority(t.priority),
          due: formatDue(t.due_date),
          assignedNurse: formatName(nurse?.first_name, nurse?.last_name, t.assigned_to || "Nurse"),
          assignedNurseId: nurse?.id || t.assigned_to,
          status: (t.status || "PENDING").toUpperCase(),
          createdBy: t.created_by || "",
          acknowledged: Boolean(t.acknowledged),
          acknowledgmentTime: t.acknowledged_at || null,
        };
      });
      setTasks(items);
    } catch (err: unknown) {
      console.error("Failed to load tasks", err);
      setErrorMessage("Could not load tasks. Please try again.");
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
    loadTasks();
  }, [loadOptions, loadTasks]);

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
        throw new Error(error.error || error.message || "Failed to assign task");
      }

      setSuccessMessage("Task assigned successfully!");

      await loadTasks();

      if (nurses.length > 0) setSelectedNurse(nurses[0].id);
      if (patients.length > 0) setSelectedPatient(patients[0].id);
      setSelectedTask("MEDICATION");
      setDueDate("");

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || "Error assigning task");
      } else {
        setErrorMessage("Error assigning task");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const progressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const acknowledgedCount = tasks.filter((t) => t.acknowledged).length;
  const totalTasks = tasks.length;
  const ackRate = totalTasks === 0 ? 0 : Math.round((acknowledgedCount / totalTasks) * 100);

  const formDisabled = nurses.length === 0 || patients.length === 0;

  return (
    <div className="space-y-8 bg-background text-on-surface">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Nurse Coordination
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Assign and monitor high-priority nursing workflow with real-time acknowledgment tracking.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => { loadOptions(); loadTasks(); }}
          className="mt-1 rounded-lg border border-outline-variant/15 bg-surface-lowest text-xs uppercase tracking-wider text-on-surface hover:bg-surface-low shadow-none"
        >
          Refresh
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <article className="rounded-xl border-l-[3px] border-primary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Total Assigned
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-primary">{totalTasks}</p>
          </div>
        </article>
        <article className="rounded-xl border-l-[3px] border-secondary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Pending
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-secondary">{pendingTasks.length}</p>
          </div>
        </article>
        <article className="rounded-xl border-l-[3px] border-tertiary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            In Progress
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-black text-tertiary">{progressTasks.length}</p>
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
              disabled={formDisabled}
            >
              {nurses.map((nurse) => (
                <option key={nurse.id} value={nurse.id}>
                  {nurse.name}
                </option>
              ))}
            </select>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              disabled={formDisabled}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              disabled={formDisabled}
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
              disabled={formDisabled}
            />
            <Button
              onClick={handleAssignTask}
              disabled={isLoading || formDisabled}
              className="rounded-lg bg-gradient-to-r from-primary to-primary-container text-primary-foreground hover:opacity-90 shadow-none font-bold uppercase text-xs tracking-wider disabled:opacity-50"
            >
              {isLoading ? "Assigning..." : "Assign Task"}
            </Button>
          </div>

          {formDisabled && (
            <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm font-semibold">
              Add nurses/patients first, or check Supabase connection.
            </div>
          )}

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
              {acknowledgedCount} out of {totalTasks} tasks have been acknowledged by assigned nurses.
              <br />
              <span className="font-semibold text-on-surface">
                {ackRate}% acknowledgment rate
              </span>
            </p>
          </div>
          <div className="flex justify-between pt-4 border-t border-surface-low">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active Nurses</p>
              <p className="text-3xl font-black text-primary">{nurses.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Awaiting ACK</p>
              <p className="text-3xl font-black text-error">{totalTasks - acknowledgedCount}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-primary" />
          <h3 className="text-2xl font-bold tracking-tight text-on-surface">Coordination Board</h3>
        </div>

        {tasksLoading ? (
          <div className="rounded-lg bg-surface-lowest p-4 text-sm text-on-surface-variant">Loading tasks...</div>
        ) : totalTasks === 0 ? (
          <div className="rounded-lg bg-surface-lowest p-4 text-sm text-on-surface-variant">No tasks yet. Assign a task to get started.</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pending</h4>
                <span className="inline-block px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold">
                  {pendingTasks.length}
                </span>
              </div>
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary">In Progress</h4>
                <span className="inline-block px-2 py-1 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold">
                  {progressTasks.length}
                </span>
              </div>
              {progressTasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-green-700">Completed</h4>
                <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  {completedTasks.length}
                </span>
              </div>
              {completedTasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
