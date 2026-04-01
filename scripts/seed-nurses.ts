/**
 * Seed script to add nurses to the system
 * Usage: npx ts-node scripts/seed-nurses.ts
 * 
 * Creates demo nurses in user_profiles table with NURSE role
 * Does NOT affect doctors, patients, or any other data
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

const DEMO_NURSES = [
  {
    email: "nurse.anjali@clinic.com",
    password: "DemoNurse@123",
    firstName: "Anjali",
    lastName: "Patel",
    phone: "+91-8765432101",
  },
  {
    email: "nurse.maya@clinic.com",
    password: "DemoNurse@123",
    firstName: "Maya",
    lastName: "Singh",
    phone: "+91-8765432102",
  },
  {
    email: "nurse.sneha@clinic.com",
    password: "DemoNurse@123",
    firstName: "Sneha",
    lastName: "Verma",
    phone: "+91-8765432103",
  },
];

async function seedNurses() {
  console.log("👩‍⚕️  Starting nurse seeding...\n");

  for (const nurse of DEMO_NURSES) {
    try {
      // Check if nurse already exists
      const { data: existingAuth } = await supabase.auth.admin.listUsers();
      const nurseExists = existingAuth.users?.some(
        (u) => u.email === nurse.email
      );

      if (nurseExists) {
        console.log(`✅ Nurse ${nurse.email} already exists - skipping`);
        continue;
      }

      // Create auth user
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: nurse.email,
          password: nurse.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(`❌ Error creating auth user ${nurse.email}:`, authError);
        continue;
      }

      if (!authUser.user) {
        console.error(`❌ No user returned for ${nurse.email}`);
        continue;
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          auth_id: authUser.user.id,
          first_name: nurse.firstName,
          last_name: nurse.lastName,
          role: "NURSE",
          phone: nurse.phone,
        })
        .select()
        .single();

      if (profileError) {
        console.error(
          `❌ Error creating profile for ${nurse.email}:`,
          profileError
        );
        continue;
      }

      console.log(
        `✅ Nurse created: ${nurse.firstName} ${nurse.lastName} (${nurse.email})`
      );
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Password: ${nurse.password}\n`);
    } catch (error) {
      console.error(`❌ Unexpected error for ${nurse.email}:`, error);
    }
  }

  console.log("✅ Nurse seeding complete!\n");
  console.log("📝 Next step: Run seed-patients.ts to add patients");
}

seedNurses().catch(console.error);
