import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOC_TYPES = ["AADHAAR", "PAN", "PASSPORT", "MARRIAGE_CERTIFICATE"] as const;
type DocType = (typeof ALLOWED_DOC_TYPES)[number];

// ──────────────────────────────────────────────────────────────────────────────
// GET  /api/nurse/patients/[patientId]/kyc
// Returns all kyc_documents rows for this patient
// ──────────────────────────────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;

    const { data, error } = await supabase
      .from("kyc_documents")
      .select("id, doc_type, file_url, status, verified_by, verified_at, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      if (
        error.message.includes("does not exist") ||
        error.message.includes("schema cache") ||
        error.code === "42P01"
      ) {
        return NextResponse.json({ success: true, data: [], warning: "kyc_documents table not yet created" });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST  /api/nurse/patients/[patientId]/kyc
// Accepts multipart/form-data with fields: docType, file
// Uploads the file to Supabase Storage (bucket: kyc-documents) and saves
// the public URL in kyc_documents.
// Falls back gracefully if Storage is not configured (saves a placeholder URL).
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";
    const { patientId } = await params;

    // Resolve nurse profile
    let nurseProfile: { id: string } | null = null;
    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: p } = await supabase
          .from("user_profiles")
          .select("id, role")
          .eq("auth_id", authData.user.id)
          .single();
        if (p && (p.role === "NURSE" || p.role === "DOCTOR")) nurseProfile = p;
      }
    } else if (isDevMode) {
      const { data: p } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("role", "NURSE")
        .limit(1)
        .single();
      nurseProfile = p ?? { id: "dev-id" };
    }

    if (!nurseProfile && !isDevMode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!nurseProfile) nurseProfile = { id: "dev-id" };

    // Parse multipart form
    const formData = await request.formData();
    const docType = formData.get("docType") as string | null;
    const file = formData.get("file") as File | null;

    if (!docType || !ALLOWED_DOC_TYPES.includes(docType as DocType)) {
      return NextResponse.json(
        { error: `Invalid docType. Allowed: ${ALLOWED_DOC_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Supabase Storage bucket: kyc-documents
    const fileExt = file.name.split(".").pop() ?? "pdf";
    const storagePath = `${patientId}/${docType}_${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    let fileUrl = `placeholder://${storagePath}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.warn(
        "Supabase Storage upload failed (bucket may not exist). Saving placeholder URL.",
        uploadError.message
      );
      // Non-fatal: we still record the document row with a placeholder
    } else {
      const { data: urlData } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(uploadData.path);
      fileUrl = urlData.publicUrl;
    }

    // Remove any existing row for same patient + doc type so we don't accumulate duplicates
    await supabase
      .from("kyc_documents")
      .delete()
      .eq("patient_id", patientId)
      .eq("doc_type", docType);

    // Insert new record
    const { data: inserted, error: insertError } = await supabase
      .from("kyc_documents")
      .insert({
        patient_id: patientId,
        doc_type: docType,
        file_url: fileUrl,
        status: "PENDING",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Audit log
    try {
      await supabase.from("audit_log").insert({
        user_id: nurseProfile.id === "dev-id" ? null : nurseProfile.id,
        action: "UPLOAD_KYC_DOCUMENT",
        table_name: "kyc_documents",
        record_id: inserted.id,
        new_data: { doc_type: docType, patient_id: patientId },
      });
    } catch (_) {}

    return NextResponse.json({ success: true, data: inserted });
  } catch (err: any) {
    console.error("KYC upload error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PUT  /api/nurse/patients/[patientId]/kyc
// Body: { documentId: string, status: "VERIFIED" | "REJECTED" }
// Updates the status of a kyc_documents row
// ──────────────────────────────────────────────────────────────────────────────
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

    if (!documentId || !["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "documentId and status (VERIFIED | REJECTED) are required" },
        { status: 400 }
      );
    }

    let verifiedBy: string | null = null;
    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: p } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .single();
        verifiedBy = p?.id ?? null;
      }
    }

    const { data, error } = await supabase
      .from("kyc_documents")
      .update({
        status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("patient_id", patientId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
