import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

const fallbackNurses = [
  { id: "nurse-demo-1", first_name: "Demo", last_name: "Nurse", role: "NURSE" },
];

export async function GET() {
  try {
    const isDevMode = process.env.NODE_ENV === "development";

    if (!supabaseServer) {
      return NextResponse.json({ data: fallbackNurses });
    }

    const { data, error } = await supabaseServer
      .from("user_profiles")
      .select("id, first_name, last_name, role")
      .eq("role", "NURSE")
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Failed to load nurses", error);
      if (isDevMode) {
        return NextResponse.json({ data: fallbackNurses });
      }
      return NextResponse.json(
        { error: "Failed to load nurses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error loading nurses", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
