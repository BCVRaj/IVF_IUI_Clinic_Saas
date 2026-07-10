import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET — returns lab reports for all patients assigned to this doctor
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    let doctorProfileId: string | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "DOCTOR")
          .single();
        doctorProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("role", "DOCTOR")
        .limit(1)
        .single();
      doctorProfileId = profile?.id ?? null;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!doctorProfileId) {
      // In dev mode with no doctor profile, still return mock data
      if (isDevMode) return NextResponse.json({ success: true, data: MOCK_REPORTS });
      return NextResponse.json({ data: [] });
    }

    // Get patients assigned to this doctor
    const { data: assignments } = await supabaseServer
      .from("doctor_patient_assignments")
      .select("patient_id")
      .eq("doctor_id", doctorProfileId)
      .eq("status", "ACTIVE");

    const patientIds = assignments?.map((a: any) => a.patient_id) || [];

    // Dev fallback: if no assignments, return all reports in DB
    let query = supabaseServer
      .from("medical_results")
      .select(`
        id,
        patient_id,
        result_type,
        result_date,
        result_data,
        interpretation,
        created_at,
        patients!patient_id (id, first_name, last_name, date_of_birth)
      `)
      .order("created_at", { ascending: false });

    if (patientIds.length > 0) {
      query = query.in("patient_id", patientIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Doctor lab reports fetch error:", error);
      // In dev mode, return mock data so the UI is always visible
      if (isDevMode) return NextResponse.json({ success: true, data: MOCK_REPORTS });
      return NextResponse.json({ data: [] });
    }

    // If DB returned empty in dev mode, use mock data so UI stays functional
    const finalData = (data && data.length > 0) ? data : (isDevMode ? MOCK_REPORTS : []);
    return NextResponse.json({ success: true, data: finalData });
  } catch (error: any) {
    console.error("Doctor lab reports error:", error);
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ success: true, data: MOCK_REPORTS });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — doctor annotates / approves / flags a lab report
export async function PUT(request: NextRequest) {
  try {
    const { reportId, interpretation } = await request.json();

    if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

    const { data, error } = await supabaseServer
      .from("medical_results")
      .update({ interpretation: interpretation ?? undefined })
      .eq("id", reportId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── Dev Mock Data ────────────────────────────────────────────────────────────
const MOCK_REPORTS = [
  {
    id: "mock-report-001",
    patient_id: "DEMO-0001",
    result_type: "Hormone Panel (FSH / LH / E2)",
    result_date: "2024-06-15",
    result_data: {
      "FSH (Day 3)": "6.2 mIU/mL",
      "LH (Day 3)": "4.1 mIU/mL",
      "Estradiol (E2)": "38 pg/mL",
      "Progesterone (P4)": "0.8 ng/mL",
      "AMH": "2.4 ng/mL",
      "TSH": "2.1 µIU/mL",
    },
    interpretation: null,
    created_at: "2024-06-15T08:00:00Z",
    patients: { id: "DEMO-0001", first_name: "Sarah", last_name: "Chen", date_of_birth: "1990-03-15" },
  },
  {
    id: "mock-report-002",
    patient_id: "DEMO-0001",
    result_type: "Complete Blood Count (CBC)",
    result_date: "2024-06-14",
    result_data: {
      "Hemoglobin": "13.2 g/dL",
      "WBC Count": "6,800 /µL",
      "Platelet Count": "2,10,000 /µL",
      "Hematocrit": "40%",
      "MCV": "88 fL",
    },
    interpretation: "CBC within normal limits. No anaemia detected.",
    created_at: "2024-06-14T09:30:00Z",
    patients: { id: "DEMO-0001", first_name: "Sarah", last_name: "Chen", date_of_birth: "1990-03-15" },
  },
  {
    id: "mock-report-003",
    patient_id: "DEMO-0001",
    result_type: "Thyroid Function Test",
    result_date: "2024-06-13",
    result_data: {
      "TSH": "2.4 µIU/mL",
      "Free T3": "3.1 pg/mL",
      "Free T4": "1.2 ng/dL",
      "Anti-TPO Antibodies": "< 35 IU/mL (Normal)",
    },
    interpretation: null,
    created_at: "2024-06-13T10:00:00Z",
    patients: { id: "DEMO-0001", first_name: "Sarah", last_name: "Chen", date_of_birth: "1990-03-15" },
  },
  {
    id: "mock-report-004",
    patient_id: "DEMO-0002",
    result_type: "Semen Analysis",
    result_date: "2024-06-16",
    result_data: {
      "Volume": "3.2 mL",
      "Concentration": "52 million/mL",
      "Total Motility": "58%",
      "Progressive Motility": "46%",
      "Normal Morphology (Kruger)": "6%",
      "Liquefaction Time": "20 min",
    },
    interpretation: null,
    created_at: "2024-06-16T11:00:00Z",
    patients: { id: "DEMO-0002", first_name: "Elena", last_name: "Rodriguez", date_of_birth: "1988-07-22" },
  },
  {
    id: "mock-report-005",
    patient_id: "DEMO-0002",
    result_type: "AMH & Ovarian Reserve Panel",
    result_date: "2024-06-12",
    result_data: {
      "AMH": "1.8 ng/mL",
      "AFC (Antral Follicle Count)": "9 follicles",
      "FSH (Day 2)": "7.5 mIU/mL",
      "Estradiol (E2)": "42 pg/mL",
    },
    interpretation: "Slightly low ovarian reserve. Consider adjusted stimulation protocol.",
    created_at: "2024-06-12T08:30:00Z",
    patients: { id: "DEMO-0002", first_name: "Elena", last_name: "Rodriguez", date_of_birth: "1988-07-22" },
  },
  {
    id: "mock-report-006",
    patient_id: "DEMO-0003",
    result_type: "Infectious Disease Screening (IDS)",
    result_date: "2024-06-10",
    result_data: {
      "HIV 1 & 2": "Non-reactive",
      "Hepatitis B (HBsAg)": "Non-reactive",
      "Hepatitis C (HCV)": "Non-reactive",
      "Syphilis (VDRL/TPHA)": "Non-reactive",
      "Rubella IgG": "Immune (Positive)",
    },
    interpretation: "All IDS results negative. Cleared for ART procedure.",
    created_at: "2024-06-10T09:00:00Z",
    patients: { id: "DEMO-0003", first_name: "Marcus", last_name: "Thorne", date_of_birth: "1985-11-08" },
  },
];
