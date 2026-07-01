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
    const { status, notes } = await request.json();

    if (!status || !["TAKEN", "MISSED", "HELD"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: nurseProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (nurseProfile?.role !== "NURSE") {
      return NextResponse.json({ error: "Only nurses can confirm adherence" }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from("medication_adherence")
      .update({
        status,
        notes: notes || null,
        confirmed_by_nurse: nurseProfile.id,
        confirmed_at: new Date().toISOString(),
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
