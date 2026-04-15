import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const params = await context.params;
    const { taskId } = params;

    // Get authentication token
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    let nurseProfileId: string;

    if (token) {
      // Real authentication - get nurse from token
      const { data: authData } = await supabaseServer.auth.getUser(token);

      if (!authData?.user?.id) {
        return NextResponse.json(
          { error: "Invalid authentication token" },
          { status: 401 }
        );
      }

      // Get nurse profile
      const { data: profile, error: profileError } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("auth_id", authData.user.id)
        .eq("role", "NURSE")
        .single();

      if (profileError || !profile?.id) {
        return NextResponse.json(
          { error: "Nurse profile not found" },
          { status: 404 }
        );
      }

      nurseProfileId = profile.id;
    } else if (isDevMode) {
      // Development mode - use first nurse from database
      const { data: profile, error: profileError } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("role", "NURSE")
        .limit(1)
        .single();

      if (profileError || !profile?.id) {
        return NextResponse.json(
          { error: "No nurse profile found for development" },
          { status: 404 }
        );
      }

      nurseProfileId = profile.id;
    } else {
      // Production - require authentication
      return NextResponse.json(
        { error: "Unauthorized - Please provide authentication token" },
        { status: 401 }
      );
    }

    // Update task to mark as acknowledged
    const { data: updatedTask, error: updateError } = await supabaseServer
      .from("coordination_tasks")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("assigned_to", nurseProfileId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to acknowledge task: " + updateError.message },
        { status: 500 }
      );
    }

    if (!updatedTask) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error acknowledging task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
