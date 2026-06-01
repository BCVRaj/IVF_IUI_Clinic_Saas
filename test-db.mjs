import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const patientId = "IVF-0354";
  const { data: patient, error: patientError } = await supabaseServer
    .from("patients")
    .select(`
      *,
      ivf_cycles (
        id,
        status,
        start_date,
        end_date
      ),
      medications (
        id,
        medication_name,
        dose,
        route,
        start_date,
        end_date
      ),
      kyc_documents (
        id,
        document_type,
        file_url,
        status,
        uploaded_at,
        verified_at
      )
    `)
    .eq("id", patientId)
    .single();

  console.log("Error:", patientError);
  console.log("Patient:", patient);
}
test();
