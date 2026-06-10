import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;

    // Dev-mode: no token → skip auth checks and load the patient directly
    // (mirrors the same fallback in /api/doctor/patients)
    if (!token) {
      if (!isDevMode) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Fall through to the patient fetch below without role/assignment checks
    } else {
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

      // Check role-based access
      if (profile?.role === "DOCTOR") {
        const { data: assignment } = await supabaseServer
          .from("doctor_patient_assignments")
          .select("id")
          .eq("doctor_id", profile.id)
          .eq("patient_id", patientId)
          .single();

        // In dev mode allow even if no explicit assignment exists
        if (!assignment && !isDevMode) {
          return NextResponse.json(
            { error: "Patient not found or access denied" },
            { status: 404 }
          );
        }
      } else if (profile?.role === "NURSE") {
        const { data: assignment } = await supabaseServer
          .from("nurse_patient_assignments")
          .select("id")
          .eq("nurse_id", profile.id)
          .eq("patient_id", patientId)
          .single();

        if (!assignment && !isDevMode) {
          return NextResponse.json(
            { error: "Patient not found or access denied" },
            { status: 404 }
          );
        }
      } else if (profile?.role === "PATIENT") {
        const { data: patientRow } = await supabaseServer
          .from("patients")
          .select("user_profile_id")
          .eq("id", patientId)
          .single();

        if (patientRow?.user_profile_id !== profile.id) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
      // Unknown role in dev mode → fall through
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

    let kyc_documents: Record<string, unknown>[] = [];
    try {
      const { data: docs } = await supabaseServer
        .from("kyc_documents")
        .select("id, doc_type, file_url, status, created_at, verified_at")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
        
      if (docs) {
        kyc_documents = docs;
      }
    } catch (e) {
      // Ignore error if table doesn't exist
    }

    let clinical_history: Record<string, unknown>[] = [];
    try {
      const { data: hist } = await supabaseServer
        .from("clinical_history")
        .select("*")
        .eq("patient_id", patientId);
      if (hist) clinical_history = hist;
    } catch (e) {}

    let semen_analysis: Record<string, unknown>[] = [];
    try {
      const { data: sem } = await supabaseServer
        .from("semen_analysis")
        .select("*")
        .eq("patient_id", patientId)
        .order("collection_date", { ascending: false });
      if (sem) semen_analysis = sem;
    } catch (e) {}

    let scan_records: Record<string, unknown>[] = [];
    try {
      const { data: scans } = await supabaseServer
        .from("scan_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("scan_date", { ascending: false });
      if (scans) scan_records = scans;
    } catch (e) {}

    let stimulation_daily_log: Record<string, unknown>[] = [];
    try {
      const { data: stim } = await supabaseServer
        .from("stimulation_daily_log")
        .select("*")
        .eq("patient_id", patientId)
        .order("log_date", { ascending: true });
      if (stim) stimulation_daily_log = stim;
    } catch (e) {}

    let opu_records: Record<string, unknown>[] = [];
    try {
      const { data: opu } = await supabaseServer
        .from("opu_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("retrieval_date", { ascending: false });
      if (opu) opu_records = opu;
    } catch (e) {}

    let embryology_records: Record<string, unknown>[] = [];
    try {
      const { data: emb } = await supabaseServer
        .from("embryology_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (emb) embryology_records = emb;
    } catch (e) {}

    let embryo_transfer_records: Record<string, unknown>[] = [];
    try {
      const { data: trans } = await supabaseServer
        .from("embryo_transfer_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("transfer_date", { ascending: false });
      if (trans) embryo_transfer_records = trans;
    } catch (e) {}

    let cycle_outcomes: Record<string, unknown>[] = [];
    try {
      const { data: outcomes } = await supabaseServer
        .from("cycle_outcomes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (outcomes) cycle_outcomes = outcomes;
    } catch (e) {}

    let billing_records: Record<string, unknown>[] = [];
    try {
      const { data: bill } = await supabaseServer
        .from("billing_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("invoice_date", { ascending: false });
      if (bill) billing_records = bill;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      data: {
        ...patient,
        kyc_documents,
        clinical_history,
        semen_analysis,
        scan_records,
        stimulation_daily_log,
        opu_records,
        embryology_records,
        embryo_transfer_records,
        cycle_outcomes,
        billing_records,
      },
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
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;

    // Resolved profile — used below for role checks on onboardingStatus
    let profile: { id: string; role: string } | null = null;

    if (!token) {
      if (!isDevMode) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Dev mode: no token → treat as DOCTOR so onboardingStatus CLEARED is allowed
      profile = { id: "dev", role: "DOCTOR" };
    } else {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: p } = await supabaseServer
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (!p || (p.role !== "DOCTOR" && p.role !== "NURSE")) {
        return NextResponse.json(
          { error: "Only doctors or nurses can update patient compliance data" },
          { status: 403 }
        );
      }

      profile = p;

      // Verify assignment (skip check in dev mode)
      if (!profile) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!isDevMode) {
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
      }
    }

    const {
      nartsrId,
      idDocumentType,
      idDocumentNumber,
      medicalVisaStatus,
      marriageCertVerified,
      onboardingStatus,
    } = await request.json();

    const docTypeMap: Record<string, string> = { Aadhar: "AADHAAR", PAN: "PAN", Passport: "PASSPORT" };

    // Build update object with only the fields that were provided
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nartsrId !== undefined) updates.nartsr_id = nartsrId;
    if (idDocumentType !== undefined) updates.id_document_type = docTypeMap[idDocumentType] ?? idDocumentType;
    if (idDocumentNumber !== undefined) updates.id_document_number = idDocumentNumber;
    if (medicalVisaStatus !== undefined) updates.medical_visa_status = medicalVisaStatus;
    if (marriageCertVerified !== undefined) updates.marriage_cert_verified = marriageCertVerified;
    // Only doctors can mark a patient as CLEARED
    if (onboardingStatus !== undefined && profile!.role === "DOCTOR") {
      updates.onboarding_status = onboardingStatus;
    }

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
      user_id: profile!.id,
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
