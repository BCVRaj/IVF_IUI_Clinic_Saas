import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;

    let profile: { id: string; role: string } | null = null;

    if (!token) {
      if (!isDevMode) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Dev mode fallback
      profile = { id: "dev-id", role: "DOCTOR" };
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
          { error: "Access denied. Only doctors and nurses can log clinical data." },
          { status: 403 }
        );
      }

      profile = p;
    }

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify doctor/nurse is assigned to this patient (skipped in dev mode)
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
              { error: "Access denied. You are not assigned to this patient." },
              { status: 403 }
            );
          }
        } else if (profile.role === "NURSE") {
          const { data: assignment } = await supabaseServer
            .from("nurse_patient_assignments")
            .select("id")
            .eq("nurse_id", profile.id)
            .eq("patient_id", patientId)
            .single();
          if (!assignment) {
            return NextResponse.json(
              { error: "Access denied. You are not assigned to this patient." },
              { status: 403 }
            );
          }
        }
      }

    // Read payload
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Invalid payload. 'type' and 'data' are required fields." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "clinical_history",
      "semen_analysis",
      "scan_records",
      "stimulation_daily_log",
      "opu_records",
      "embryology_records",
      "embryo_transfer_records",
      "cycle_outcomes",
      "billing_records",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid record type '${type}'.` },
        { status: 400 }
      );
    }

    // Build the query and verify fields
    const insertPayload: Record<string, any> = {
      patient_id: patientId,
      ...data,
    };

    // If analyzed_by, performed_by, embryologist_id, physician_id is not set, set it to doctor's user profile ID if applicable
    if (profile && profile.id !== "dev-id") {
      if (type === "semen_analysis" && !insertPayload.analyzed_by) {
        insertPayload.analyzed_by = profile.id;
      } else if (type === "scan_records" && !insertPayload.performed_by) {
        insertPayload.performed_by = profile.id;
      } else if (type === "opu_records" && !insertPayload.performed_by) {
        insertPayload.performed_by = profile.id;
      } else if (type === "embryology_records" && !insertPayload.embryologist_id) {
        insertPayload.embryologist_id = profile.id;
      } else if (type === "embryo_transfer_records" && !insertPayload.physician_id) {
        insertPayload.physician_id = profile.id;
      }
    }

    const { data: insertedData, error: insertError } = await supabaseServer
      .from(type)
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) {
      // Detect missing table errors (schema not applied to Supabase yet)
      if (
        insertError.message.includes("does not exist") ||
        insertError.message.includes("schema cache") ||
        insertError.code === "42P01"
      ) {
        return NextResponse.json(
          {
            error: `Table '${type}' does not exist in the database. Please run the database migration SQL from src/lib/database-schema-safe-migration.sql in your Supabase SQL Editor.`,
            code: "TABLE_NOT_FOUND",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || `Failed to insert record into ${type}.` },
        { status: 400 }
      );
    }

    // HIPAA audit log
    try {
      await supabaseServer.from("audit_log").insert({
        user_id: profile.id === "dev-id" ? null : profile.id,
        action: `CREATE_${type.toUpperCase()}`,
        table_name: type,
        record_id: insertedData.id ? String(insertedData.id) : patientId,
        new_data: insertedData,
      });
    } catch (auditError) {
      console.error("Audit logging failed:", auditError);
      // Do not block the primary operation if audit logging fails in dev mode
    }

    return NextResponse.json({
      success: true,
      message: `Record created successfully in ${type}`,
      data: insertedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
