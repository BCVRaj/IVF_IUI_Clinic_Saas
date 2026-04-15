import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    let nurseProfileId: string = "";

    if (token) {
      // Real authentication
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();
        
      if (!profile || profile.role !== "NURSE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      nurseProfileId = profile.id;
    } else if (isDevMode) {
      // Development mode
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("role", "NURSE")
        .limit(1)
        .single();

      if (!profile) {
        // If NO Profile exists, return an empty array of tasks instead of failing!
        return NextResponse.json([]);
      }
      nurseProfileId = profile.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Now if nurseProfileId isn't empty, try to fetch tasks
    if (nurseProfileId) {
       const { data: tasks, error } = await supabaseServer
        .from("coordination_tasks")
        .select(`
          *,
          patients!patient_id (id, first_name, last_name),
          user_profiles!created_by (id, first_name, last_name)
        `)
        .eq("assigned_to", nurseProfileId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ data: [], error: "Internal server error" }, { status: 500 });
      }

      return NextResponse.json({ data: tasks || [] });
    } else {
      return NextResponse.json({ data: [] });
    }

  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
