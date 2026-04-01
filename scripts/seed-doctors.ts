/**
 * Seed script to add doctors to the system
 * Usage: npx ts-node scripts/seed-doctors.ts
 * 
 * Creates demo doctors in user_profiles table with DOCTOR role
 * Does NOT affect nurses, patients, or any other data
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

const DEMO_DOCTORS = [
  {
    email: "doctor.rajesh@clinic.com",
    password: "DemoDoc@123",
    firstName: "Rajesh",
    lastName: "Sharma",
    phone: "+91-9876543210",
  },
  {
    email: "doctor.priya@clinic.com",
    password: "DemoDoc@123",
    firstName: "Priya",
    lastName: "Gupta",
    phone: "+91-9876543211",
  },
];

async function seedDoctors() {
  console.log("🏥 Starting doctor seeding...\n");

  for (const doctor of DEMO_DOCTORS) {
    try {
      // Check if doctor already exists
      const { data: existingAuth } = await supabase.auth.admin.listUsers();
      const doctorExists = existingAuth.users?.some(
        (u) => u.email === doctor.email
      );

      if (doctorExists) {
        console.log(`✅ Doctor ${doctor.email} already exists - skipping`);
        continue;
      }

      // Create auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: doctor.email,
          password: doctor.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(`❌ Error creating auth user ${doctor.email}:`, authError);
        continue;
      }

      if (!authUser.user) {
        console.error(`❌ No user returned for ${doctor.email}`);
        continue;
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          auth_id: authUser.user.id,
          first_name: doctor.firstName,
          last_name: doctor.lastName,
          role: "DOCTOR",
          phone: doctor.phone,
        })
        .select()
        .single();

      if (profileError) {
        console.error(
          `❌ Error creating profile for ${doctor.email}:`,
          profileError
        );
        continue;
      }

      console.log(
        `✅ Doctor created: ${doctor.firstName} ${doctor.lastName} (${doctor.email})`
      );
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Password: ${doctor.password}\n`);
    } catch (error) {
      console.error(`❌ Unexpected error for ${doctor.email}:`, error);
    }
  }

  console.log("✅ Doctor seeding complete!\n");
  console.log("📝 Next step: Run seed-nurses.ts to add nurses");
}

seedDoctors().catch(console.error);
