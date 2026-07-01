import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet return an empty list — not an error the UI should crash on
      if (
        error.message.includes("does not exist") ||
        error.message.includes("schema cache") ||
        error.code === "42P01"
      ) {
        return NextResponse.json({ data: [], warning: "compliance_documents table not yet created" });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;
    const { formType, fileUrl } = await request.json();

    if (!formType || !fileUrl) {
      return NextResponse.json({ error: "Missing formType or fileUrl" }, { status: 400 });
    }

    // Upsert or insert depending on if they are overwriting
    // For simplicity we just insert a new record
    const { data, error } = await supabase
      .from("compliance_documents")
      .insert([
        {
          patient_id: patientId,
          form_type: formType,
          file_url: fileUrl,
          status: "PENDING",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;
    const { documentId, status } = await request.json();

    if (!documentId || !status) {
      return NextResponse.json({ error: "Missing documentId or status" }, { status: 400 });
    }

    let verifiedBy = null;
    let signedAt = null;

    if (status === "VERIFIED") {
      signedAt = new Date().toISOString();
      if (!isDevMode && token) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: p } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("auth_id", authData.user.id)
            .single();
          if (p) verifiedBy = p.id;
        }
      }
    }

    const updates: any = { status };
    if (verifiedBy) updates.verified_by = verifiedBy;
    if (signedAt) updates.signed_at = signedAt;

    const { data, error } = await supabase
      .from("compliance_documents")
      .update(updates)
      .eq("id", documentId)
      .eq("patient_id", patientId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
