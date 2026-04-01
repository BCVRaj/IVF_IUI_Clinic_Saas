import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type BasicProfile = { id: string; role?: string | null; first_name?: string | null; last_name?: string | null; auth_id?: string | null };
type Patient = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; date_of_birth?: string | null; age?: number | null; gender?: string | null; blood_type?: string | null };
type TaskRow = {
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
  created_at?: string | null;
  patient?: Patient | null;
  patients?: Patient | null;
  nurse?: BasicProfile | null;
  user_profiles?: BasicProfile | null;
};

const fallbackDoctorProfile: BasicProfile = {
  id: "doctor-demo-1",
  role: "DOCTOR",
  first_name: "Demo",
  last_name: "Doctor",
  auth_id: null,
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    const {
      patientId,
      assignedToNurseId,
      title,
      description,
      taskType,
      priority,
      dueDate,
    } = await request.json();

    if (!patientId || !assignedToNurseId || !title || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let doctorProfile: BasicProfile | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (profile?.role !== "DOCTOR") {
        return NextResponse.json(
          { error: "Only doctors can create tasks" },
          { status: 403 }
        );
      }

      doctorProfile = profile;
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("role", "DOCTOR")
        .limit(1)
        .single()
        // error handling;

      doctorProfile = profile || fallbackDoctorProfile;
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: nurseProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("id", assignedToNurseId)
      .single();

    if (!nurseProfile || nurseProfile.role !== "NURSE") {
      return NextResponse.json(
        { error: "Invalid nurse ID" },
        { status: 400 }
      );
    }

    const { data: patient } = await supabaseServer
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const { data: task, error } = await supabaseServer
      .from("coordination_tasks")
      .insert({
        patient_id: patientId,
        created_by: doctorProfile.id,
        assigned_to: assignedToNurseId,
        title,
        description: description || null,
        task_type: taskType,
        priority: priority || "NORMAL",
        due_date: dueDate || null,
        status: "PENDING",
        acknowledged: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await supabaseServer.from("alerts").insert({
      patient_id: patientId,
      alert_type: "NEW_TASK_ASSIGNED",
      message: `New task assigned: ${title}`,
      severity: priority === "URGENT" ? "ALERT" : "INFO",
      visible_to_doctors: false,
      visible_to_nurses: true,
      visible_to_patient: false,
    });

    await supabaseServer.from("audit_log").insert({
      user_id: doctorProfile.id,
      action: "CREATE_COORDINATION_TASK",
      table_name: "coordination_tasks",
      record_id: task.id,
      new_data: task,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task created and assigned to nurse",
        data: task,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    let doctorProfile: BasicProfile | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (profile?.role !== "DOCTOR") {
        return NextResponse.json(
          { error: "Only doctors can access this endpoint" },
          { status: 403 }
        );
      }

      doctorProfile = profile;
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("role", "DOCTOR")
        .limit(1)
        .single()
        // error handling;

      doctorProfile = profile || fallbackDoctorProfile;
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: tasks, error } = await supabaseServer
      .from("coordination_tasks")
      .select(`
        id,
        patient_id,
        assigned_to,
        created_by,
        title,
        description,
        task_type,
        priority,
        status,
        due_date,
        acknowledged,
        acknowledged_at,
        created_at,
        patient:patients (id, first_name, last_name, email),
        nurse:user_profiles!assigned_to (id, first_name, last_name)
      `)
      .eq("created_by", doctorProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      if (isDevMode) {
        return NextResponse.json({
          success: true,
          data: [],
          by_status: {
            pending: [],
            in_progress: [],
            completed: [],
          },
          count: 0,
        });
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const shaped: TaskRow[] = (tasks || []).map((t) => ({
      ...t,
      patient: (t as TaskRow).patient || (t as TaskRow).patients || null,
      nurse: (t as TaskRow).nurse || (t as TaskRow).user_profiles || null,
    }));

    const tasksByStatus = {
      pending: shaped.filter((t) => (t.status || "").toUpperCase() === "PENDING"),
      in_progress: shaped.filter((t) => (t.status || "").toUpperCase() === "IN_PROGRESS"),
      completed: shaped.filter((t) => (t.status || "").toUpperCase() === "COMPLETED"),
    };

    return NextResponse.json({
      success: true,
      data: shaped,
      by_status: tasksByStatus,
      count: shaped.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
