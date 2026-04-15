import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET — returns complaints for the logged-in patient (or all for nurse in dev mode)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    if (!supabaseServer) return NextResponse.json({ data: [] });

    // If authenticated, filter by patient
    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id, role")
          .eq("auth_id", authData.user.id)
          .single();

        if (profile?.role === "PATIENT") {
          // Find the patient record
          const { data: patient } = await supabaseServer
            .from("patients")
            .select("id")
            .eq("user_profile_id", profile.id)
            .single();

          if (!patient) return NextResponse.json({ data: [] });

          const { data, error } = await supabaseServer
            .from("patient_complaints")
            .select("id, patient_id, complaint_text, severity, status, created_at, updated_at, nurse_notes, doctor_notes")
            .eq("patient_id", patient.id)
            .order("created_at", { ascending: false });

          if (error) return NextResponse.json({ data: [] });
          return NextResponse.json({ data: data || [] });
        }

        if (profile?.role === "NURSE") {
          // Nurse sees complaints from their assigned patients
          const { data: assignments } = await supabaseServer
            .from("nurse_patient_assignments")
            .select("patient_id")
            .eq("nurse_id", profile.id)
            .eq("status", "ACTIVE");

          const patientIds = assignments?.map((a: any) => a.patient_id) || [];

          if (patientIds.length === 0) return NextResponse.json({ data: [] });

          const { data, error } = await supabaseServer
            .from("patient_complaints")
            .select("id, patient_id, complaint_text, severity, status, created_at, updated_at, nurse_notes")
            .in("patient_id", patientIds)
            .order("created_at", { ascending: false });

          if (error) return NextResponse.json({ data: [] });
          return NextResponse.json({ data: data || [] });
        }
      }
    }

    // Dev mode fallback — return all complaints
    if (isDevMode) {
      const { data } = await supabaseServer
        .from("patient_complaints")
        .select("id, patient_id, complaint_text, severity, status, created_at, updated_at, nurse_notes")
        .order("created_at", { ascending: false });
      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error("Complaints GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — patient submits a new complaint
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    const { complaintText, severity, category } = await request.json();

    if (!complaintText) {
      return NextResponse.json({ error: "complaint_text is required" }, { status: 400 });
    }

    let patientId: string | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id, role")
          .eq("auth_id", authData.user.id)
          .single();

        if (profile?.role === "PATIENT") {
          const { data: patient } = await supabaseServer
            .from("patients")
            .select("id")
            .eq("user_profile_id", profile.id)
            .single();
          patientId = patient?.id ?? null;
        }
      }
    } else if (isDevMode) {
      // Dev mode: use first patient
      const { data: patient } = await supabaseServer
        .from("patients")
        .select("id")
        .limit(1)
        .single();
      patientId = patient?.id ?? null;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!patientId) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    // Map numeric severity to schema enum
    const severityMap: Record<string, string> = { "1": "LOW", "2": "LOW", "3": "NORMAL", "4": "HIGH", "5": "URGENT" };
    const dbSeverity = severityMap[String(severity)] || "NORMAL";

    const { data: complaint, error } = await supabaseServer
      .from("patient_complaints")
      .insert({
        patient_id: patientId,
        complaint_text: category ? `[${category}] ${complaintText}` : complaintText,
        severity: dbSeverity,
        status: "OPEN",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  } catch (error: any) {
    console.error("Complaints POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
