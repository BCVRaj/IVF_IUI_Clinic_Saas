import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function resolveNurseId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
  const isDevMode = process.env.NODE_ENV === "development";

  if (token) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("auth_id", authData.user.id)
        .eq("role", "NURSE")
        .single();
      return profile?.id ?? null;
    }
  }
  if (isDevMode) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("role", "NURSE")
      .limit(1)
      .single();
    return profile?.id ?? null;
  }
  return null;
}

// GET — list lab reports for this nurse's assigned patients
export async function GET(request: NextRequest) {
  try {
    const nurseId = await resolveNurseId(request);
    if (!nurseId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: assignments } = await supabase
      .from("nurse_patient_assignments")
      .select("patient_id")
      .eq("nurse_id", nurseId)
      .eq("status", "ACTIVE");

    const patientIds = assignments?.map((a: any) => a.patient_id) || [];
    if (patientIds.length === 0) return NextResponse.json({ data: [] });

    const { data, error } = await supabase
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
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lab reports GET error:", error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("Lab reports GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — nurse submits lab results for a patient
export async function POST(request: NextRequest) {
  try {
    const nurseId = await resolveNurseId(request);
    if (!nurseId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { patientId, resultType, resultDate, results, interpretation } = await request.json();

    if (!patientId || !resultType || !results) {
      return NextResponse.json(
        { error: "patientId, resultType, and results are required" },
        { status: 400 }
      );
    }

    // Find the doctor assigned to this patient
    const { data: assignment } = await supabase
      .from("doctor_patient_assignments")
      .select("doctor_id")
      .eq("patient_id", patientId)
      .eq("status", "ACTIVE")
      .limit(1)
      .single();

    // Fallback: use any doctor in the system
    let doctorId = assignment?.doctor_id ?? null;
    if (!doctorId) {
      const { data: anyDoctor } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("role", "DOCTOR")
        .limit(1)
        .single();
      doctorId = anyDoctor?.id ?? null;
    }

    if (!doctorId) {
      return NextResponse.json({ error: "No doctor found to assign the report" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("medical_results")
      .insert({
        patient_id: patientId,
        result_type: resultType,
        result_date: resultDate || new Date().toISOString().split("T")[0],
        result_data: results, // JSONB — store as-is
        interpretation: interpretation || null,
        doctor_id: doctorId,
      })
      .select()
      .single();

    if (error) {
      console.error("Lab report insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("Lab reports POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
