import { createClient } from "@supabase/supabase-js";

// Lazy initialization to avoid errors during build
let supabaseInstance: any = null;
let supabaseServerInstance: any = null;

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "your_supabase_url_here") {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

const getSupabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "your_supabase_url_here") {
    return null;
  }
  
  if (!supabaseServerInstance) {
    supabaseServerInstance = createClient(
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
  return supabaseServerInstance;
};

// Export getters
export const supabase = getSupabase();
export const supabaseServer = getSupabaseServer();

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          role: "DOCTOR" | "NURSE" | "PATIENT";
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
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          date_of_birth: string;
          age: number;
          created_at: string;
          updated_at: string;
        };
      };
      ivf_cycles: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          status: string;
          start_date: string;
          created_at: string;
        };
      };
      coordination_tasks: {
        Row: {
          id: string;
          doctor_id: string;
          nurse_id: string;
          patient_id: string;
          title: string;
          description: string;
          status: string;
          acknowledged: boolean;
          acknowledged_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
      };
    };
  };
};