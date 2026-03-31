import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { taskId } = await params;
    const { completionNotes } = await request.json();

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get nurse profile
    const { data: nurseProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (nurseProfile?.role !== "NURSE") {
      return NextResponse.json(
        { error: "Only nurses can complete tasks" },
        { status: 403 }
      );
    }

    // Get task
    const { data: task, error: taskError } = await supabaseServer
      .from("coordination_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Verify this nurse is assigned to this task
    if (task.assigned_to !== nurseProfile.id) {
      return NextResponse.json(
        { error: "This task is not assigned to you" },
        { status: 403 }
      );
    }

    // Update task to completed
    const { data: updatedTask, error: updateError } = await supabaseServer
      .from("coordination_tasks")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        completion_notes: completionNotes || null,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create alert for doctor
    await supabaseServer.from("alerts").insert({
      patient_id: task.patient_id,
      alert_type: "TASK_COMPLETED",
      message: `Task "${task.title}" completed by nurse`,
      severity: "INFO",
      visible_to_doctors: true,
      visible_to_nurses: false,
      visible_to_patient: false,
    });

    // Log in audit
    await supabaseServer.from("audit_log").insert({
      user_id: nurseProfile.id,
      action: "COMPLETE_TASK",
      table_name: "coordination_tasks",
      record_id: taskId,
      new_data: updatedTask,
    });

    return NextResponse.json({
      success: true,
      message: "Task marked as completed",
      data: updatedTask,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
