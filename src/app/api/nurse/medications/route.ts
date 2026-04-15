import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET — returns medications for all patients assigned to this nurse
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    let nurseProfileId: string | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "NURSE")
          .single();
        nurseProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("role", "NURSE")
        .limit(1)
        .single();
      nurseProfileId = profile?.id ?? null;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!nurseProfileId) {
      return NextResponse.json({ data: [] });
    }

    // Get patients assigned to this nurse
    const { data: assignments } = await supabaseServer
      .from("nurse_patient_assignments")
      .select("patient_id")
      .eq("nurse_id", nurseProfileId)
      .eq("status", "ACTIVE");

    const patientIds = assignments?.map((a: any) => a.patient_id) || [];

    if (patientIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get medications for those patients including patient name and adherence
    const { data: medications, error } = await supabaseServer
      .from("medications")
      .select(`
        id,
        patient_id,
        medication_name,
        dose,
        route,
        frequency,
        start_date,
        end_date,
        instructions,
        patients!patient_id (id, first_name, last_name),
        medication_adherence (
          id,
          adherence_date,
          status,
          confirmed_by_nurse,
          confirmed_at
        )
      `)
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Nurse medications fetch error:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ success: true, data: medications || [] });
  } catch (error: any) {
    console.error("Nurse medications error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
