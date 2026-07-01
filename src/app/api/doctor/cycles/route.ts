import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, protocol, startDate } = await request.json();
    if (!patientId || !protocol || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctorProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (doctorProfile?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can create cycles" },
        { status: 403 }
      );
    }

    // NARTSR Legal Gate: Hard Block
    // Check if patient has a NARTSR ID before allowing a cycle to start
    const { data: nartsrRecord, error: nartsrError } = await supabase
      .from("nartsr_records")
      .select("registry_id")
      .eq("patient_id", patientId)
      .single();

    if (nartsrError || !nartsrRecord?.registry_id) {
      return NextResponse.json(
        { error: "Missing NARTSR ID - Cycle Start Blocked. Patient must complete regulatory enrollment." },
        { status: 403 }
      );
    }

    const { data: cycle, error } = await supabase
      .from("ivf_cycles")
      .insert({
        patient_id: patientId,
        doctor_id: doctorProfile.id,
        protocol,
        status: "PLANNING",
        start_date: startDate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create default milestones
    const milestones = [
      { milestone_type: "BASELINE_SCAN", scheduled_date: startDate },
      { milestone_type: "TRIGGER_INJECTION", scheduled_date: new Date(new Date(startDate).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { milestone_type: "EGG_RETRIEVAL", scheduled_date: new Date(new Date(startDate).getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { milestone_type: "EMBRYO_TRANSFER", scheduled_date: new Date(new Date(startDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ];

    for (const milestone of milestones) {
      await supabase.from("cycle_milestones").insert({
        cycle_id: cycle.id,
        ...milestone,
        status: "PENDING",
      });
    }

    return NextResponse.json(
      { success: true, message: "Cycle created with milestones", data: cycle },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    let data, error;
    if (profile?.role === "DOCTOR") {
      ({ data, error } = await supabase
        .from("ivf_cycles")
        .select("*")
        .eq("doctor_id", profile.id));
    } else if (profile?.role === "PATIENT") {
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("user_profile_id", profile.id)
        .single();
      ({ data, error } = await supabase
        .from("ivf_cycles")
        .select("*")
        .eq("patient_id", patientData?.id));
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
