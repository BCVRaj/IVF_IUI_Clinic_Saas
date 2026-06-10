import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Helper: find or create a demo doctor so patient assignments always work in dev mode
async function getOrCreateDemoDoctor(): Promise<string | null> {
  const { data: existing } = await supabaseServer
    .from("user_profiles")
    .select("id")
    .eq("role", "DOCTOR")
    .limit(1)
    .single();
  if (existing) return existing.id;

  const demoEmail = "demo.doctor@clinic.internal";
  let doctorAuthId: string | null = null;

  const { data: newAuth, error: authErr } = await supabaseServer.auth.admin.createUser({
    email: demoEmail,
    email_confirm: true,
    user_metadata: { first_name: "Demo", last_name: "Doctor" },
  });

  if (authErr) {
    const { data: list } = await supabaseServer.auth.admin.listUsers();
    const found = list?.users?.find((u: any) => u.email === demoEmail);
    doctorAuthId = found?.id ?? null;
  } else {
    doctorAuthId = newAuth?.user?.id ?? null;
  }

  if (!doctorAuthId) return null;

  const { data: profile } = await supabaseServer
    .from("user_profiles")
    .upsert(
      { auth_id: doctorAuthId, first_name: "Demo", last_name: "Doctor", role: "DOCTOR" },
      { onConflict: "auth_id" }
    )
    .select("id")
    .single();

  return profile?.id ?? null;
}

// Helper: create a Supabase auth user + user_profile, return the profile id
async function ensureAuthProfile(
  email: string,
  firstName: string,
  lastName: string,
  role: "PATIENT" | "NURSE" | "DOCTOR"
): Promise<{ profileId: string; authUserId: string } | null> {
  // Create the auth user (service role required)
  const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (authError || !authData?.user) {
    console.error("auth.admin.createUser failed:", authError?.message);
    return null;
  }

  // Create user_profile linked to the auth user
  const { data: profile, error: profileError } = await supabaseServer
    .from("user_profiles")
    .insert({
      auth_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      role,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    console.error("user_profiles insert failed:", profileError?.message);
    // Clean up the auth user we just created
    await supabaseServer.auth.admin.deleteUser(authData.user.id);
    return null;
  }

  return { profileId: profile.id, authUserId: authData.user.id };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";

    const {
      partner1FirstName,
      partner1LastName,
      partner1Dob,
      partner1Sex,
      partner1Email,
      partner1Phone,
      partner1Address,
      partner2FirstName,
      partner2LastName,
      partner2Dob,
      partner2Sex,
      partner2Email,
      partner2Phone,
      hasInsurance,
      packageType,
      paymentPlan,
      eSignature,
      maritalStatus,
      // Compliance / KYC fields (Phase I — all optional)
      nartsrId,
      idDocumentType,
      idDocumentNumber,
      medicalVisaStatus,
      marriageCertVerified,
    } = await request.json();

    if (!partner1FirstName || !partner1LastName || !eSignature) {
      return NextResponse.json(
        { error: "Missing required fields: partner1FirstName, partner1LastName, eSignature" },
        { status: 400 }
      );
    }

    // Validate real email is provided
    if (!partner1Email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner1Email.trim())) {
      return NextResponse.json(
        { error: "A valid email address for Partner 1 is required." },
        { status: 400 }
      );
    }

    // NARTSR Legal Gate: Age Verification for Partner 1
    if (partner1Dob) {
      const diffMs = Date.now() - new Date(partner1Dob).getTime();
      const ageDt = new Date(diffMs); 
      const age = Math.abs(ageDt.getUTCFullYear() - 1970);
      const isMale = partner1Sex === "M" || partner1Sex === "Male";
      const minAge = 21;
      const maxAge = isMale ? 55 : 50;

      if (age < minAge || age > maxAge) {
        return NextResponse.json(
          { error: `Partner 1 does not meet legal age requirements for ART (Age: ${age}. Required: ${minAge}-${maxAge}).` },
          { status: 400 }
        );
      }
    }

    // NARTSR Legal Gate: Age Verification for Partner 2
    if (partner2Dob) {
      const diffMs = Date.now() - new Date(partner2Dob).getTime();
      const ageDt = new Date(diffMs); 
      const age = Math.abs(ageDt.getUTCFullYear() - 1970);
      const isMale = partner2Sex === "M" || partner2Sex === "Male";
      const minAge = 21;
      const maxAge = isMale ? 55 : 50;

      if (age < minAge || age > maxAge) {
        return NextResponse.json(
          { error: `Partner 2 does not meet legal age requirements for ART (Age: ${age}. Required: ${minAge}-${maxAge}).` },
          { status: 400 }
        );
      }
    }

    // Resolve nurse profile for audit log
    let nurseProfileId: string | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "NURSE")
          .single();
        nurseProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("role", "NURSE")
        .limit(1)
        .single();
      nurseProfileId = profile?.id ?? null;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use real email provided by nurse — replaces fake clinic email
    const email = partner1Email.trim().toLowerCase();

    // Map biological sex to DB enum
    const genderMap: Record<string, string> = { Female: "F", Male: "M", Other: "OTHER" };
    const gender = genderMap[partner1Sex] ?? null;

    // --- Step 1: Create auth user + user_profile for the patient (required by schema) ---
    const created = await ensureAuthProfile(email, partner1FirstName, partner1LastName, "PATIENT");
    if (!created) {
      return NextResponse.json(
        { error: "This email address is already registered. Please use a different email for this patient." },
        { status: 400 }
      );
    }

    // --- Step 2: Create the patients record linked to the profile ---
    const { data: patient, error: patientError } = await supabaseServer
      .from("patients")
      .insert({
        user_profile_id: created.profileId,
        first_name: partner1FirstName,
        last_name: partner1LastName,
        email,
        phone: partner1Phone || null,
        address: partner1Address || null,
        date_of_birth: partner1Dob || null,
        gender,
        marital_status: maritalStatus || null,
        medical_history: {
          partner2: {
            first_name: partner2FirstName || null,
            last_name: partner2LastName || null,
            dob: partner2Dob || null,
            sex: partner2Sex || null,
            email: partner2Email || null,
            phone: partner2Phone || null,
          },
          insurance: hasInsurance,
          packageType,
          paymentPlan,
          eSignature,
          onboardedByNurse: nurseProfileId,
        },
        // Compliance / KYC fields (Phase I — all optional)
        nartsr_id: nartsrId || null,
        id_document_type: ({ Aadhar: "AADHAAR", PAN: "PAN", Passport: "PASSPORT" } as Record<string, string>)[idDocumentType] ?? null,
        id_document_number: idDocumentNumber || null,
        medical_visa_status: medicalVisaStatus || null,
        marriage_cert_verified: marriageCertVerified ?? false,
        // PENDING_VERIFICATION when document number + marriage cert are present (NARTSR optional)
        onboarding_status: (idDocumentNumber && marriageCertVerified)
          ? "PENDING_VERIFICATION"
          : "INCOMPLETE",
      })
      .select()
      .single();

    if (patientError) {
      console.error("Patient creation error:", patientError);
      // Clean up the auth user since the patient insert failed
      await supabaseServer.auth.admin.deleteUser(created.authUserId);
      return NextResponse.json({ error: patientError.message }, { status: 400 });
    }

    // --- Step 3: Assign patient to a doctor (seed demo doctor if none exist) ---
    const doctorId = await getOrCreateDemoDoctor();
    if (doctorId) {
      await supabaseServer.from("doctor_patient_assignments").insert({
        doctor_id: doctorId,
        patient_id: patient.id,
        status: "ACTIVE",
      });
    }

    // --- Step 4: Assign to nurse ---
    if (nurseProfileId) {
      await supabaseServer.from("nurse_patient_assignments").insert({
        nurse_id: nurseProfileId,
        patient_id: patient.id,
        status: "ACTIVE",
      });
    }

    // --- Step 5: Audit log ---
    if (nurseProfileId) {
      await supabaseServer.from("audit_log").insert({
        user_id: nurseProfileId,
        action: "NURSE_ONBOARD_PATIENT",
        table_name: "patients",
        record_id: patient.id,
        new_data: { patient_id: patient.id, onboarded_by: nurseProfileId },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Patient onboarded successfully",
        data: { id: patient.id, name: `${patient.first_name} ${patient.last_name}` },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Nurse patient onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-auth-token")?.value;
    const isDevMode = process.env.NODE_ENV === "development";
    
    let nurseProfileId: string | null = null;

    if (token) {
      const { data: authData } = await supabaseServer.auth.getUser(token);
      if (authData?.user) {
        const { data: profile } = await supabaseServer
          .from("user_profiles")
          .select("id")
          .eq("auth_id", authData.user.id)
          .eq("role", "NURSE")
          .single();
        nurseProfileId = profile?.id ?? null;
      }
    } else if (isDevMode) {
      const { data: profile } = await supabaseServer
        .from("user_profiles")
        .select("id")
        .eq("role", "NURSE")
        .limit(1)
        .single();
      nurseProfileId = profile?.id ?? null;
    }

    if (!nurseProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For simplicity, return all patients assigned to this nurse, or just all patients
    // since the nurse needs to see the queue. Let's return all patients for the clinic.
    const { data: patients, error } = await supabaseServer
      .from("patients")
      .select("id, first_name, last_name, email, date_of_birth, gender, onboarding_status, nartsr_id, marriage_cert_verified");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: patients || [] });
  } catch (error: any) {
    console.error("Error fetching patients for nurse:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
