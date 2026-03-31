import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, cycleId, medicationName, dose, route, frequency, startDate, endDate, instructions } =
      await request.json();

    if (!patientId || !medicationName || !route || !frequency || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: authData } = await supabaseServer.auth.getUser(token);
    if (!authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doctorProfile } = await supabaseServer
      .from("user_profiles")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (doctorProfile?.role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can prescribe" }, { status: 403 });
    }

    const { data: medication, error } = await supabaseServer
      .from("medications")
      .insert({
        patient_id: patientId,
        cycle_id: cycleId || null,
        prescribed_by: doctorProfile.id,
        medication_name: medicationName,
        dose: dose || null,
        route,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        instructions: instructions || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create adherence records for each day
    const currentDate = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000);

    const adherenceRecords = [];
    while (currentDate <= endDateObj) {
      adherenceRecords.push({
        medication_id: medication.id,
        patient_id: patientId,
        adherence_date: currentDate.toISOString().split('T')[0],
        status: "PENDING",
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await supabaseServer.from("medication_adherence").insert(adherenceRecords);

    return NextResponse.json(
      { success: true, message: "Medication prescribed", data: medication },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
