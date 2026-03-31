import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role required" },
        { status: 400 }
      );
    }

    if (!["DOCTOR", "NURSE", "PATIENT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be DOCTOR, NURSE, or PATIENT" },
        { status: 400 }
      );
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from("user_profiles")
      .insert({
        auth_id: authData.user.id,
        first_name: firstName || "",
        last_name: lastName || "",
        role,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should delete the auth user
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: profile?.role,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
