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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId } = await params;

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors and nurses can update compliance data
    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (!profile || (profile.role !== "DOCTOR" && profile.role !== "NURSE")) {
      return NextResponse.json(
        { error: "Only doctors or nurses can update patient compliance data" },
        { status: 403 }
      );
    }

    // Verify the caller is assigned to this patient
    if (profile.role === "DOCTOR") {
      const { data: assignment } = await supabaseServer
        .from("doctor_patient_assignments")
        .select("id")
        .eq("doctor_id", profile.id)
        .eq("patient_id", patientId)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }
    } else {
      const { data: assignment } = await supabaseServer
        .from("nurse_patient_assignments")
        .select("id")
        .eq("nurse_id", profile.id)
        .eq("patient_id", patientId)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: "Patient not found or access denied" },
          { status: 404 }
        );
      }
    }

    const {
      nartsrId,
      idDocumentType,
      idDocumentNumber,
      medicalVisaStatus,
      marriageCertVerified,
    } = await request.json();

    // Build update object with only the fields that were provided
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nartsrId !== undefined) updates.nartsr_id = nartsrId;
    if (idDocumentType !== undefined) updates.id_document_type = idDocumentType;
    if (idDocumentNumber !== undefined) updates.id_document_number = idDocumentNumber;
    if (medicalVisaStatus !== undefined) updates.medical_visa_status = medicalVisaStatus;
    if (marriageCertVerified !== undefined) updates.marriage_cert_verified = marriageCertVerified;

    const { data: updatedPatient, error: updateError } = await supabaseServer
      .from("patients")
      .update(updates)
      .eq("id", patientId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Log in audit
    await supabaseServer.from("audit_log").insert({
      user_id: profile.id,
      action: "UPDATE_PATIENT_COMPLIANCE",
      table_name: "patients",
      record_id: patientId,
      new_data: updates,
    });

    return NextResponse.json({
      success: true,
      message: "Patient compliance data updated successfully",
      data: updatedPatient,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
