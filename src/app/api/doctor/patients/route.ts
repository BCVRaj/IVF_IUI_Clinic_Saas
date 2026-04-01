import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    // Dev mode fallback: allow listing patients without auth to unblock UI
    if (!token) {
      if (!supabaseServer) {
        return NextResponse.json({ data: [], success: true, count: 0 });
      }
      const { data, error } = await supabaseServer
        .from("patients")
        .select("id, first_name, last_name, email, phone, date_of_birth, age, gender, blood_type")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        if (isDevMode) {
          return NextResponse.json({ data: [], success: true, count: 0 });
        }
        return NextResponse.json({ error: "Failed to load patients" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data || [], count: data?.length || 0 });
    }

    // Authenticated flow
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can view patients" },
        { status: 403 }
      );
    }

    const { data: patients, error } = await supabaseServer
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
          age,
          gender,
          blood_type
        )
      `)
      .eq("doctor_id", profile.id)
      .eq("status", "ACTIVE");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formattedPatients = patients?.map((p: any) => p.patients) || [];

    return NextResponse.json({
      success: true,
      data: formattedPatients,
      count: formattedPatients.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
