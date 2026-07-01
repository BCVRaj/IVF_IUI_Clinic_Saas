import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can access this" }, { status: 403 });
    }

    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("user_profile_id", profile.id)
      .single();

    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can access this" }, { status: 403 });
    }

    const updates = await request.json();
    const { data: patient } = await supabase
      .from("patients")
      .update(updates)
      .eq("user_profile_id", profile.id)
      .select()
      .single();

    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
