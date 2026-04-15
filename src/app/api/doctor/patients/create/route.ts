import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      // Compliance / KYC fields (optional)
      nartsrId,
      idDocumentType,
      idDocumentNumber,
      medicalVisaStatus,
      marriageCertVerified,
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !dateOfBirth) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email, dateOfBirth" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is doctor
    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can create patients" },
        { status: 403 }
      );
    }

    // Create new patient
    const { data: patient, error: patientError } = await supabaseServer
      .from("patients")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        date_of_birth: dateOfBirth,
        gender: gender || null,
        blood_type: bloodType || null,
        // Compliance / KYC fields — all optional, fall back to null/false
        nartsr_id: nartsrId || null,
        id_document_type: idDocumentType || null,
        id_document_number: idDocumentNumber || null,
        medical_visa_status: medicalVisaStatus || null,
        marriage_cert_verified: marriageCertVerified ?? false,
      })
      .select()
      .single();

    if (patientError) {
      return NextResponse.json(
        { error: patientError.message },
        { status: 400 }
      );
    }

    // Assign patient to doctor
    const { error: assignError } = await supabaseServer
      .from("doctor_patient_assignments")
      .insert({
        doctor_id: profile.id,
        patient_id: patient.id,
      });

    if (assignError) {
      // Delete patient if assignment fails
      await supabaseServer.from("patients").delete().eq("id", patient.id);
      return NextResponse.json(
        { error: "Failed to assign patient to doctor" },
        { status: 500 }
      );
    }

    // Log in audit
    await supabaseServer.from("audit_log").insert({
      user_id: profile.id,
      action: "CREATE_PATIENT",
      table_name: "patients",
      record_id: patient.id,
      new_data: patient,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Patient created successfully",
        data: patient,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
