import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    const { patientId } = await params;
    const { documentName } = await request.json();

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
        { error: "Only nurses can trigger patient alerts" },
        { status: 403 }
      );
    }

    // Insert an alert for the patient
    const { error: alertError } = await supabase
      .from("alerts")
      .insert({
        patient_id: patientId,
        alert_type: "KYC_REQUEST",
        message: `Action Required: Please upload your ${documentName} to proceed with verification.`,
        severity: "WARNING",
        visible_to_doctors: false,
        visible_to_nurses: false,
        visible_to_patient: true,
      });

    if (alertError) throw alertError;

    // Log the audit event
    await supabase.from("audit_log").insert({
      user_id: nurseProfile.id,
      action: "NURSE_SENT_PATIENT_ALARM",
      table_name: "alerts",
      record_id: patientId,
      new_data: { documentName },
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent to patient successfully.",
    });
  } catch (error: any) {
    console.error("Alert Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
