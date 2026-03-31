import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

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

    // Get nurse profile
    const { data: nurseProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (nurseProfile?.role !== "NURSE") {
      return NextResponse.json(
        { error: "Only nurses can access this endpoint" },
        { status: 403 }
      );
    }

    // Get all tasks assigned to this nurse
    const { data: tasks, error } = await supabaseServer
      .from("coordination_tasks")
      .select(`
        *,
        patients (id, first_name, last_name, email, age),
        user_profiles!created_by (first_name, last_name, id)
      `)
      .eq("assigned_to", nurseProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Separate by status for dashboard
    const tasks_by_status = {
      pending: tasks?.filter((t: any) => t.status === "PENDING") || [],
      in_progress:
        tasks?.filter((t: any) => t.status === "IN_PROGRESS") || [],
      completed:
        tasks?.filter((t: any) => t.status === "COMPLETED") || [],
    };

    return NextResponse.json({
      success: true,
      data: tasks || [],
      by_status: tasks_by_status,
      count: tasks?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
