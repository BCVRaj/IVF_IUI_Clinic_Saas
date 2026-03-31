import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;

    if (!token) {
      // Clear cookie anyway
      const response = NextResponse.json({ success: true });
      response.cookies.delete("sb-auth-token");
      return response;
    }

    // Sign out from Supabase
    const { error } = await supabaseServer.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
    }

    // Clear auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete("sb-auth-token");
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
