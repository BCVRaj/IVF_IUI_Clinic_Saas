/**
 * Seed script to add patients to the system
 * Usage: npx ts-node scripts/seed-patients.ts
 * 
 * Creates demo patients in patients table with associated user_profiles
 * Does NOT affect doctors, nurses, or any other data
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL");
  console.error("   Required: SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_PATIENTS = [
  {
    email: "patient.rekha@example.com",
    password: "DemoPatient@123",
    firstName: "Rekha",
    lastName: "Desai",
    phone: "+91-7654321001",
    dateOfBirth: "1990-05-15",
    gender: "F",
    bloodType: "O+",
  },
  {
    email: "patient.meera@example.com",
    password: "DemoPatient@123",
    firstName: "Meera",
    lastName: "Kapoor",
    phone: "+91-7654321002",
    dateOfBirth: "1992-08-22",
    gender: "F",
    bloodType: "B+",
  },
  {
    email: "patient.simran@example.com",
    password: "DemoPatient@123",
    firstName: "Simran",
    lastName: "Iyer",
    phone: "+91-7654321003",
    dateOfBirth: "1988-12-10",
    gender: "F",
    bloodType: "AB+",
  },
];

async function seedPatients() {
  console.log("🤰 Starting patient seeding...\n");

  for (const patient of DEMO_PATIENTS) {
    try {
      // Check if patient already exists
      const { data: existingAuth } = await supabase.auth.admin.listUsers();
      const patientExists = existingAuth.users?.some(
        (u) => u.email === patient.email
      );

      if (patientExists) {
        console.log(`✅ Patient ${patient.email} already exists - skipping`);
        continue;
      }

      // Create auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: patient.email,
          password: patient.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(
          `❌ Error creating auth user ${patient.email}:`,
          authError
        );
        continue;
      }

      if (!authUser.user) {
        console.error(`❌ No user returned for ${patient.email}`);
        continue;
      }

      // Create user profile first (required for patients table)
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          auth_id: authUser.user.id,
          first_name: patient.firstName,
          last_name: patient.lastName,
          role: "PATIENT",
          phone: patient.phone,
        })
        .select()
        .single();

      if (profileError) {
        console.error(
          `❌ Error creating profile for ${patient.email}:`,
          profileError
        );
        continue;
      }

      // Create patient record
      const { data: patientRecord, error: patientError } = await supabase
        .from("patients")
        .insert({
          user_profile_id: profile.id,
          first_name: patient.firstName,
          last_name: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          date_of_birth: patient.dateOfBirth,
          gender: patient.gender,
          blood_type: patient.bloodType,
        })
        .select()
        .single();

      if (patientError) {
        console.error(
          `❌ Error creating patient record for ${patient.email}:`,
          patientError
        );
        continue;
      }

      console.log(
        `✅ Patient created: ${patient.firstName} ${patient.lastName} (${patient.email})`
      );
      console.log(`   Patient ID: ${patientRecord.id}`);
      console.log(`   DOB: ${patient.dateOfBirth}`);
      console.log(`   Blood Type: ${patient.bloodType}`);
      console.log(`   Password: ${patient.password}\n`);
    } catch (error) {
      console.error(`❌ Unexpected error for ${patient.email}:`, error);
    }
  }

  console.log("✅ Patient seeding complete!\n");
  console.log("🎉 All demo data has been created!");
  console.log("📝 You can now assign tasks from doctors to nurses\n");
}

seedPatients().catch(console.error);
