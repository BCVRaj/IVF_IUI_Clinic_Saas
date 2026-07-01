import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    let patientProfileId: string | null = null;
    let authUserId: string | null = null;

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "PATIENT")
          .single();
        patientProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, auth_id")
        .eq("role", "PATIENT")
        .limit(1)
        .single();
      patientProfileId = profile?.id ?? null;
      authUserId = profile?.auth_id ?? null;
    }

    if (!patientProfileId || !authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the patient record ID
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_profile_id", patientProfileId)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    // Fetch alerts visible to patient
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("visible_to_patient", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: alerts || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
