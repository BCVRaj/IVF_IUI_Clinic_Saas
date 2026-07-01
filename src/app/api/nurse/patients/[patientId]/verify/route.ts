import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    const { nartsrId, approveKyc } = await request.json();
    const { patientId } = await params;

    let nurseProfile: { id: string; role: string } | null = null;

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();
      nurseProfile = profile;
    } else if (isDevMode) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "NURSE")
        .limit(1)
        .single();
      nurseProfile = profile;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!nurseProfile || (nurseProfile.role !== "NURSE" && !isDevMode)) {
      return NextResponse.json(
        { error: "Only nurses can verify KYC and NARTSR" },
        { status: 403 }
      );
    }

    // Process KYC approval
    let newStatus = "PENDING_VERIFICATION";
    if (approveKyc) {
      newStatus = "CLEARED";
      const { error: patientErr } = await supabase
        .from("patients")
        .update({
          onboarding_status: "CLEARED",
          marriage_cert_verified: true,
        })
        .eq("id", patientId);

      if (patientErr) throw patientErr;

      // Update KYC documents status
      try {
        await supabase
          .from("kyc_documents")
          .update({
            status: "VERIFIED",
            verified_by: nurseProfile.id,
            verified_at: new Date().toISOString(),
          })
          .eq("patient_id", patientId);
      } catch (err) {
        console.error("Failed to update kyc_documents, ignoring:", err);
      }
    }

    // Process NARTSR ID
    if (nartsrId) {
      // First update the `patients` table convenience field
      await supabase
        .from("patients")
        .update({ nartsr_id: nartsrId })
        .eq("id", patientId);

      // Then upsert the strict regulatory table
      const { data: existingRecord } = await supabase
        .from("nartsr_records")
        .select("id")
        .eq("patient_id", patientId)
        .single();

      if (existingRecord) {
        await supabase
          .from("nartsr_records")
          .update({ registry_id: nartsrId })
          .eq("id", existingRecord.id);
      } else {
        await supabase
          .from("nartsr_records")
          .insert({
            patient_id: patientId,
            registry_id: nartsrId,
          });
      }
    }

    // Log the audit event
    await supabase.from("audit_log").insert({
      user_id: nurseProfile.id,
      action: "NURSE_VERIFY_KYC_NARTSR",
      table_name: "patients",
      record_id: patientId,
      new_data: { nartsrId, approveKyc },
    });

    return NextResponse.json({
      success: true,
      message: "Verification and NARTSR integration successful.",
    });
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
