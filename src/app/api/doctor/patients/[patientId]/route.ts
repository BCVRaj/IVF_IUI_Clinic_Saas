import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { patientId } = await params;

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    // Check if user has access to this patient
    if (profile?.role === "DOCTOR") {
      const { data: assignment } = await supabaseServer
        .from("doctor_patient_assignments")
        .select("*")
        .eq("doctor_id", profile.id)
        .eq("patient_id", patientId)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }
    } else if (profile?.role === "NURSE") {
      const { data: assignment } = await supabaseServer
        .from("nurse_patient_assignments")
        .select("*")
        .eq("nurse_id", profile.id)
        .eq("patient_id", patientId)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }
    } else if (profile?.role === "PATIENT") {
      // Patient can only view themselves
      const { data: patient } = await supabaseServer
        .from("patients")
        .select("user_profile_id")
        .eq("id", patientId)
        .single();

      if (patient?.user_profile_id !== profile.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Get patient details with related data
    const { data: patient, error: patientError } = await supabaseServer
      .from("patients")
      .select(`
        *,
        ivf_cycles (
          id,
          status,
          start_date,
          end_date
        ),
        medications (
          id,
          medication_name,
          dose,
          route,
          start_date,
          end_date
        )
      `)
      .eq("id", patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
