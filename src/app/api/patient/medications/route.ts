import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can access this" }, { status: 403 });
    }

    const { data: patient } = await supabaseServer
      .from("patients")
      .select("id")
      .eq("user_profile_id", profile.id)
      .single();

    const { data: medications } = await supabaseServer
      .from("medications")
      .select(`
        id,
        medication_name,
        dose,
        route,
        frequency,
        start_date,
        end_date,
        instructions,
        medication_adherence (
          id,
          adherence_date,
          status,
          confirmed_by_nurse,
          confirmed_at
        )
      `)
      .eq("patient_id", patient?.id);

    return NextResponse.json({ success: true, data: medications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
