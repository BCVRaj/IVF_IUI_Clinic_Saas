import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const supabase = await createClient();
    const isDevMode = process.env.NODE_ENV === "development";

    const { patientId, cycleId, medicationName, dose, route, frequency, startDate, endDate, instructions } =
      await request.json();

    if (!patientId || !medicationName || !route || !frequency || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let doctorProfile: { id: string; role: string } | null = null;

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();
      doctorProfile = profile;
    } else if (isDevMode) {
      // Dev mode: no token → use first available DOCTOR profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "DOCTOR")
        .limit(1)
        .single();
      doctorProfile = profile;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!doctorProfile || (doctorProfile.role !== "DOCTOR" && !isDevMode)) {
      return NextResponse.json({ error: "Only doctors can prescribe" }, { status: 403 });
    }


    let finalCycleId = cycleId;

    if (!finalCycleId) {
      // Find the most recent cycle for this patient
      const { data: latestCycle } = await supabase
        .from("ivf_cycles")
        .select("id")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestCycle?.id) {
        finalCycleId = latestCycle.id;
      } else {
        // Auto-create a prep cycle since the database requires a cycle_id for medications
        const { data: newCycle, error: cycleError } = await supabase
          .from("ivf_cycles")
          .insert({
            patient_id: patientId,
            doctor_id: doctorProfile.id,
            protocol: "Medication Prep",
            status: "PLANNING",
            start_date: startDate,
          })
          .select("id")
          .single();

        if (cycleError) {
          return NextResponse.json({ error: "Database error (ivf_cycles): " + cycleError.message }, { status: 500 });
        }
        finalCycleId = newCycle.id;
      }
    }

    const { data: medication, error } = await supabase
      .from("medications")
      .insert({
        patient_id: patientId,
        cycle_id: finalCycleId,
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

    await supabase.from("medication_adherence").insert(adherenceRecords);

    return NextResponse.json(
      { success: true, message: "Medication prescribed", data: medication },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
