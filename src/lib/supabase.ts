import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Singleton instances ─────────────────────────────────────────────────────
let _supabaseInstance: SupabaseClient | null = null;
let _supabaseServerInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client for browser/anon usage.
 * Returns null if env vars are missing (e.g. during build).
 */
function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_supabase_url_here"
  ) {
    return null;
  }

  if (!_supabaseInstance) {
    _supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseInstance;
}

/**
 * Returns a Supabase client with service-role key for server-side usage.
 * Returns null if env vars are missing (e.g. during build).
 */
function createSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === "your_supabase_url_here"
  ) {
    return null;
  }

  if (!_supabaseServerInstance) {
    _supabaseServerInstance = createClient(
      supabaseUrl,
      supabaseServiceRoleKey || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabaseServerInstance;
}

// ─── Named exports used across the app ──────────────────────────────────────
// These are getter functions so they're always re-evaluated at runtime,
// never cached as null during Next.js build-time static analysis.
export const getSupabase = createSupabaseClient;
export const getSupabaseServer = createSupabaseServerClient;

/**
 * Convenience proxy — behaves like a SupabaseClient but resolves the
 * singleton lazily so routes never break during static build.
 *
 * Usage (same as before):
 *   import { supabase } from "@/lib/supabase";
 *   const { data } = await supabase.from("patients").select("*");
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createSupabaseClient();
    if (!client) {
      throw new Error(
        "Supabase client is not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Same proxy pattern for the server/service-role client.
 *
 * Usage (same as before):
 *   import { supabaseServer } from "@/lib/supabase";
 *   const { data } = await supabaseServer.from("patients").select("*");
 */
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createSupabaseServerClient();
    if (!client) {
      throw new Error(
        "Supabase server client is not initialized. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// ─── TypeScript type helpers ─────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          auth_id: string;
          first_name: string;
          last_name: string;
          role: "DOCTOR" | "NURSE" | "PATIENT";
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_profiles"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
      };
      patients: {
        Row: {
          id: string;
          user_profile_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          date_of_birth: string;
          gender: "M" | "F" | "OTHER" | null;
          blood_type: string | null;
          marital_status: string | null;
          medical_history: Record<string, unknown>;
          allergies: string[] | null;
          nartsr_id: string | null;
          id_document_type: "AADHAAR" | "PAN" | "PASSPORT" | null;
          id_document_number: string | null;
          medical_visa_status: string | null;
          marriage_cert_verified: boolean;
          onboarding_status: "INCOMPLETE" | "PENDING_VERIFICATION" | "CLEARED";
          created_at: string;
          updated_at: string;
        };
      };
      ivf_cycles: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          protocol: string;
          status: "PLANNING" | "STIMULATION" | "RETRIEVAL" | "TRANSFER" | "COMPLETED" | "CANCELLED";
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      coordination_tasks: {
        Row: {
          id: string;
          patient_id: string;
          created_by: string;
          assigned_to: string;
          title: string;
          description: string | null;
          task_type: "MEDICATION" | "MONITORING" | "PROCEDURE" | "COMMUNICATION" | "FOLLOWUP";
          status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
          priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
          due_date: string | null;
          acknowledged: boolean;
          acknowledged_at: string | null;
          completed_at: string | null;
          completion_notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      kyc_documents: {
        Row: {
          id: string;
          patient_id: string;
          doc_type: "AADHAAR" | "PAN" | "PASSPORT" | "MARRIAGE_CERTIFICATE";
          file_url: string;
          status: "PENDING" | "VERIFIED" | "REJECTED";
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      compliance_documents: {
        Row: {
          id: string;
          patient_id: string;
          form_type: "FORM_6" | "FORM_7" | "FORM_8" | "FORM_12" | "AFFIDAVIT";
          file_url: string;
          status: "PENDING" | "VERIFIED" | "REJECTED";
          signed_at: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};