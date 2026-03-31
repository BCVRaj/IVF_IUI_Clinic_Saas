import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can access this" }, { status: 403 });
    }

    const { data: patient } = await supabaseServer
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
    const token = request.cookies.get("sb-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (profile?.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can access this" }, { status: 403 });
    }

    const updates = await request.json();
    const { data: patient } = await supabaseServer
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
