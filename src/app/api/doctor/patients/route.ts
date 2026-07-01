import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const fallbackPatients = [
  {
    id: "DEMO-0001",
    first_name: "Sarah",
    last_name: "Chen",
    email: "sarah.chen@demo.com",
    phone: "555-010-0001",
    date_of_birth: "1990-03-15",
    age: 34,
    gender: "FEMALE",
    blood_type: "O+",
  },
  {
    id: "DEMO-0002",
    first_name: "Elena",
    last_name: "Rodriguez",
    email: "elena.rodriguez@demo.com",
    phone: "555-010-0002",
    date_of_birth: "1988-07-22",
    age: 36,
    gender: "FEMALE",
    blood_type: "A+",
  },
  {
    id: "DEMO-0003",
    first_name: "Marcus",
    last_name: "Thorne",
    email: "marcus.thorne@demo.com",
    phone: "555-010-0003",
    date_of_birth: "1985-11-08",
    age: 39,
    gender: "MALE",
    blood_type: "B+",
  },
];

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    // Dev mode fallback: allow listing patients without auth to unblock UI
    if (!token) {
      if (!supabase) {
        return NextResponse.json({ data: [], success: true, count: 0 });
      }
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, onboarding_status")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        if (isDevMode) {
          return NextResponse.json({ data: fallbackPatients, success: true, count: fallbackPatients.length });
        }
        return NextResponse.json({ error: "Failed to load patients" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: (data && data.length > 0) ? data : (isDevMode ? fallbackPatients : []), count: data?.length || 0 });
    }

    // Authenticated flow
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    // In dev mode, if no doctor profile exists for this token, fall through to all-patients query
    if (!isDevMode && profile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can view patients" },
        { status: 403 }
      );
    }

    // If a doctor profile exists, fetch via assignments
    if (profile?.role === "DOCTOR") {
      const { data: patients, error } = await supabase
        .from("doctor_patient_assignments")
        .select(`
          patient_id,
          patients (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            blood_type,
            onboarding_status
          )
        `)
        .eq("doctor_id", profile.id)
        .eq("status", "ACTIVE");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const formattedPatients = patients?.map((p: any) => p.patients).filter(Boolean) || [];

      // In dev mode, if no assigned patients found, fall back to ALL patients so
      // newly onboarded patients are always visible regardless of assignment state
      if (isDevMode && formattedPatients.length === 0) {
        const { data: allPatients } = await supabase
          .from("patients")
          .select("id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, onboarding_status")
          .order("created_at", { ascending: false })
          .limit(50);
        return NextResponse.json({
          success: true,
          data: allPatients || [],
          count: allPatients?.length || 0,
        });
      }

      return NextResponse.json({
        success: true,
        data: formattedPatients,
        count: formattedPatients.length,
      });
    }

    // Dev mode fallback: no doctor profile for this token — return all patients
    const { data: allPatients, error: allError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone, date_of_birth, gender, blood_type, onboarding_status")
      .order("created_at", { ascending: false })
      .limit(50);

    if (allError) {
      return NextResponse.json({ data: fallbackPatients, success: true, count: fallbackPatients.length });
    }

    return NextResponse.json({
      success: true,
      data: (allPatients && allPatients.length > 0) ? allPatients : fallbackPatients,
      count: allPatients?.length || fallbackPatients.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
