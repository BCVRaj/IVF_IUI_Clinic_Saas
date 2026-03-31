import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      patientId,
      assignedToNurseId,
      title,
      description,
      taskType,
      priority,
      dueDate,
    } = await request.json();

    // Validate required fields
    if (!patientId || !assignedToNurseId || !title || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctorProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (doctorProfile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can create tasks" },
        { status: 403 }
      );
    }

    // Verify nurse ID is valid and is actually a nurse
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

    // Verify patient exists
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

    // Create coordination task
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

    // Create alert for nurse
    await supabaseServer.from("alerts").insert({
      patient_id: patientId,
      alert_type: "NEW_TASK_ASSIGNED",
      message: `New task assigned: ${title}`,
      severity: priority === "URGENT" ? "ALERT" : "INFO",
      visible_to_doctors: false,
      visible_to_nurses: true,
      visible_to_patient: false,
    });

    // Log in audit
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctorProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (doctorProfile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can view their tasks" },
        { status: 403 }
      );
    }

    // Get all tasks created by this doctor
    const { data: tasks, error } = await supabaseServer
      .from("coordination_tasks")
      .select(`
        *,
        patients (id, first_name, last_name, email),
        user_profiles!assigned_to (first_name, last_name)
      `)
      .eq("created_by", doctorProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tasks || [],
      count: tasks?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
