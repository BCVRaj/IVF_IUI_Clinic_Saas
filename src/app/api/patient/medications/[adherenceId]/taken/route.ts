import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adherenceId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { adherenceId } = await params;
    const { notes } = await request.json();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can do this" }, { status: 403 });
    }

    // Get adherence record
    const { data: adherence } = await supabase
      .from("medication_adherence")
      .select("patient_id")
      .eq("id", adherenceId)
      .single();

    // Verify patient owns this adherence record
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_profile_id", profile.id)
      .single();

    if (adherence?.patient_id !== patient?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("medication_adherence")
      .update({
        status: "TAKEN",
        notes: notes || null,
      })
      .eq("id", adherenceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
