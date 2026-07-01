import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BasicProfile = { id: string; role?: string | null; first_name?: string | null; last_name?: string | null; auth_id?: string | null };

// In dev mode, seed a demo nurse via auth.admin if none exist in user_profiles
async function getOrCreateDemoNurse(): Promise<BasicProfile | null> {
  // Check if any nurse already exists
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("role", "NURSE")
    .limit(1)
    .single();
  if (existing) return existing;

  // No nurses — create one via admin API
  const demoEmail = "demo.nurse@clinic.internal";
  let nurseAuthId: string | null = null;

  // Try to create a new auth user
  const { data: newAuth, error: authErr } = await supabase.auth.admin.createUser({
    email: demoEmail,
    email_confirm: true,
    user_metadata: { first_name: "Demo", last_name: "Nurse" },
  });

  if (authErr) {
    // If the user already exists in auth but profile is missing, list users to get the id
    const { data: list } = await supabase.auth.admin.listUsers();
    const found = list?.users?.find((u: any) => u.email === demoEmail);
    nurseAuthId = found?.id ?? null;
  } else {
    nurseAuthId = newAuth?.user?.id ?? null;
  }

  if (!nurseAuthId) return null;

  // Upsert the user_profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .upsert(
      { auth_id: nurseAuthId, first_name: "Demo", last_name: "Nurse", role: "NURSE" },
      { onConflict: "auth_id" }
    )
    .select("*")
    .single();

  return profile ?? null;
}
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
  id: "00000000-0000-0000-0000-000000000000",
  role: "DOCTOR",
  first_name: "Demo",
  last_name: "Doctor",
  auth_id: null,
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (!profile || profile.role !== "DOCTOR") {
        return NextResponse.json(
          { error: "Only doctors can create tasks" },
          { status: 403 }
        );
      }

      doctorProfile = profile;
    } else if (isDevMode) {
      const { data: profile } = await supabase
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

    if (!doctorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Look up nurse profile — in dev mode, fall back to any available nurse if ID not found
    let nurseProfile: BasicProfile | null = null;
    const { data: nurseByIdData, error: nurseByIdError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", assignedToNurseId)
      .eq("role", "NURSE")
      .single();

    if (nurseByIdData) {
      nurseProfile = nurseByIdData;
    } else if (isDevMode) {
      // Fallback: find any nurse, or seed a demo nurse if none exist
      if (nurseByIdError) {
        console.warn("Nurse lookup by ID failed in dev mode, seeding fallback:", nurseByIdError.message);
      }
      nurseProfile = await getOrCreateDemoNurse();
    }

    if (!nurseProfile) {
      return NextResponse.json(
        { error: "Invalid nurse ID — no nurse found. Ensure SUPABASE_SERVICE_ROLE_KEY is set." },
        { status: 400 }
      );
    }

    // Use the resolved nurse ID (may differ from assignedToNurseId in dev fallback)
    const resolvedNurseId = nurseProfile.id;

    const { data: patient } = await supabase
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

    const { data: task, error } = await supabase
      .from("coordination_tasks")
      .insert({
        patient_id: patientId,
        created_by: doctorProfile.id,
        assigned_to: resolvedNurseId,
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

    await supabase.from("alerts").insert({
      patient_id: patientId,
      alert_type: "NEW_TASK_ASSIGNED",
      message: `New task assigned: ${title}`,
      severity: priority === "URGENT" ? "ALERT" : "INFO",
      visible_to_doctors: false,
      visible_to_nurses: true,
      visible_to_patient: false,
    });

    await supabase.from("audit_log").insert({
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
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    let doctorProfile: BasicProfile | null = null;

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (!profile || profile.role !== "DOCTOR") {
        return NextResponse.json(
          { error: "Only doctors can access this endpoint" },
          { status: 403 }
        );
      }

      doctorProfile = profile;
    } else if (isDevMode) {
      const { data: profile } = await supabase
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

    if (!doctorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { data: tasks, error } = await supabase
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

    const shaped: TaskRow[] = (tasks || []).map((t: any) => ({
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
