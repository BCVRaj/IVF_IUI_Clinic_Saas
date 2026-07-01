import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — returns lab reports for all patients assigned to this doctor
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    let doctorProfileId: string | null = null;

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "DOCTOR")
          .single();
        doctorProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("role", "DOCTOR")
        .limit(1)
        .single();
      doctorProfileId = profile?.id ?? null;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!doctorProfileId) return NextResponse.json({ data: [] });

    // Get patients assigned to this doctor
    const { data: assignments } = await supabase
      .from("doctor_patient_assignments")
      .select("patient_id")
      .eq("doctor_id", doctorProfileId)
      .eq("status", "ACTIVE");

    const patientIds = assignments?.map((a: any) => a.patient_id) || [];

    // Dev fallback: if no assignments, return all reports in DB
    let query = supabase
      .from("medical_results")
      .select(`
        id,
        patient_id,
        result_type,
        result_date,
        result_data,
        interpretation,
        created_at,
        patients!patient_id (id, first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (patientIds.length > 0) {
      query = query.in("patient_id", patientIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Doctor lab reports fetch error:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("Doctor lab reports error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — doctor annotates / approves / flags a lab report
export async function PUT(request: NextRequest) {
  try {
    const { reportId, interpretation, status } = await request.json();

    if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

    const { data, error } = await supabase
      .from("medical_results")
      .update({ interpretation: interpretation ?? undefined })
      .eq("id", reportId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
