import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const isDevMode = process.env.NODE_ENV === "development";

    if (!supabaseServer) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabaseServer
      .from("patient_complaints")
      .select("id, patient_id, complaint_text, severity, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load complaints", error);
      if (isDevMode) {
        return NextResponse.json({ data: [] });
      }
      return NextResponse.json(
        { error: "Failed to load complaints" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error loading complaints", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
