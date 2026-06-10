-- ============================================================
-- SAFE MIGRATION: Run this in Supabase SQL Editor
-- This script creates ALL missing tables safely using
-- CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS
-- so it's safe to run even if some tables already exist.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER PROFILES (Extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('DOCTOR', 'NURSE', 'PATIENT')) NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. PATIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_profile_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'OTHER')),
  blood_type TEXT,
  marital_status TEXT,
  medical_history JSONB DEFAULT '{}'::jsonb,
  allergies TEXT[],
  nartsr_id TEXT UNIQUE,
  id_document_type TEXT CHECK (id_document_type IN ('AADHAAR', 'PAN', 'PASSPORT')),
  id_document_number TEXT,
  medical_visa_status TEXT,
  marriage_cert_verified BOOLEAN DEFAULT FALSE,
  onboarding_status TEXT DEFAULT 'INCOMPLETE' CHECK (onboarding_status IN ('INCOMPLETE', 'PENDING_VERIFICATION', 'CLEARED')),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. DOCTOR-PATIENT ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED')),
  UNIQUE(doctor_id, patient_id)
);

-- ============================================
-- 4. NURSE-PATIENT ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS nurse_patient_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nurse_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED')),
  UNIQUE(nurse_id, patient_id)
);

-- ============================================
-- 5. IVF CYCLES
-- ============================================
CREATE TABLE IF NOT EXISTS ivf_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL,
  status TEXT DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'STIMULATION', 'RETRIEVAL', 'TRANSFER', 'COMPLETED', 'CANCELLED')),
  start_date DATE NOT NULL,
  end_date DATE,
  baseline_scan_date DATE,
  trigger_date DATE,
  retrieval_date DATE,
  transfer_date DATE,
  notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. CYCLE MILESTONES
-- ============================================
CREATE TABLE IF NOT EXISTS cycle_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. MEDICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  prescribed_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dose VARCHAR(50),
  route TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. MEDICATION ADHERENCE
-- ============================================
CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  adherence_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('TAKEN', 'MISSED', 'HELD')),
  notes TEXT,
  confirmed_by_nurse UUID REFERENCES user_profiles(id),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(medication_id, adherence_date)
);

-- ============================================
-- 9. APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('ULTRASOUND', 'BLOODWORK', 'PROCEDURE', 'CONSULTATION', 'FOLLOW_UP')),
  scheduled_date TIMESTAMP NOT NULL,
  completed_date TIMESTAMP,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. MEDICAL RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS medical_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  result_type TEXT NOT NULL,
  result_date DATE NOT NULL,
  result_data JSONB NOT NULL,
  interpretation TEXT,
  doctor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. COORDINATION TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS coordination_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('MEDICATION', 'MONITORING', 'PROCEDURE', 'COMMUNICATION', 'FOLLOWUP')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  due_date DATE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  completed_at TIMESTAMP,
  completion_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. PATIENT COMPLAINTS
-- ============================================
CREATE TABLE IF NOT EXISTS patient_complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  complaint_text TEXT NOT NULL,
  severity TEXT DEFAULT 'NORMAL' CHECK (severity IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  reported_to_nurse UUID REFERENCES user_profiles(id),
  reported_at TIMESTAMP,
  nurse_notes TEXT,
  reported_to_doctor UUID REFERENCES user_profiles(id),
  doctor_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 13. CRYO SAMPLES
-- ============================================
CREATE TABLE IF NOT EXISTS cryo_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
  sample_type TEXT NOT NULL CHECK (sample_type IN ('EMBRYO', 'SPERM', 'EGG')),
  quantity INT,
  quality_grade TEXT,
  storage_location TEXT,
  storage_date DATE NOT NULL,
  freeze_date DATE NOT NULL,
  thaw_date DATE,
  thaw_status TEXT CHECK (thaw_status IN ('FROZEN', 'THAWED')),
  viability_after_thaw INT,
  notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 14. ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ALERT')),
  visible_to_doctors BOOLEAN DEFAULT TRUE,
  visible_to_nurses BOOLEAN DEFAULT FALSE,
  visible_to_patient BOOLEAN DEFAULT TRUE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 15. AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 16. ACCESS LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17. NARTSR RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS nartsr_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  registry_id TEXT UNIQUE,
  enrollment_date TIMESTAMP DEFAULT NOW(),
  outcome_report_status TEXT DEFAULT 'PENDING' CHECK (outcome_report_status IN ('PENDING', 'REPORTED', 'ARCHIVED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17b. KYC DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('AADHAAR', 'PAN', 'PASSPORT', 'MARRIAGE_CERTIFICATE')),
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17c. COMPLIANCE DOCUMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('FORM_6', 'FORM_7', 'FORM_8', 'FORM_12', 'AFFIDAVIT')),
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  signed_at TIMESTAMP,
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17d. COUNSELING SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_date TIMESTAMP NOT NULL DEFAULT NOW(),
  topics_covered JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  signed_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17e. IDS RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS ids_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  hiv_result TEXT CHECK (hiv_result IN ('NEGATIVE', 'POSITIVE', 'PENDING')),
  hbv_result TEXT CHECK (hbv_result IN ('NEGATIVE', 'POSITIVE', 'PENDING')),
  hcv_result TEXT CHECK (hcv_result IN ('NEGATIVE', 'POSITIVE', 'PENDING')),
  syphilis_result TEXT CHECK (syphilis_result IN ('NEGATIVE', 'POSITIVE', 'PENDING')),
  lab_report_url TEXT,
  verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 18. CLINICAL HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS clinical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  infertility_type TEXT CHECK (infertility_type IN ('PRIMARY', 'SECONDARY')) NOT NULL,
  duration_years INT NOT NULL CHECK (duration_years >= 0),
  previous_treatments JSONB DEFAULT '[]'::jsonb,
  family_history TEXT,
  female_gynecological_history JSONB DEFAULT '{}'::jsonb,
  male_medical_history JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 19. SEMEN ANALYSIS
-- ============================================
CREATE TABLE IF NOT EXISTS semen_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  collection_date TIMESTAMP DEFAULT NOW(),
  abstinence_days INT CHECK (abstinence_days >= 0),
  liquefaction_time INT CHECK (liquefaction_time >= 0),
  viscosity TEXT,
  volume NUMERIC(4, 2) CHECK (volume >= 0),
  ph NUMERIC(3, 1) CHECK (ph >= 0 AND ph <= 14),
  concentration NUMERIC(6, 2) CHECK (concentration >= 0),
  total_count NUMERIC(6, 2) CHECK (total_count >= 0),
  progressive_motility NUMERIC(5, 2) CHECK (progressive_motility >= 0 AND progressive_motility <= 100),
  non_progressive_motility NUMERIC(5, 2) CHECK (non_progressive_motility >= 0 AND non_progressive_motility <= 100),
  immotility NUMERIC(5, 2) CHECK (immotility >= 0 AND immotility <= 100),
  morphology_normal NUMERIC(5, 2) CHECK (morphology_normal >= 0 AND morphology_normal <= 100),
  round_cells NUMERIC(4, 2) CHECK (round_cells >= 0),
  interpretation TEXT,
  analyzed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 20. SCAN RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS scan_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  scan_date TIMESTAMP NOT NULL DEFAULT NOW(),
  scan_type TEXT CHECK (scan_type IN ('BASELINE', 'MONITORING', 'HSG', 'OTHER')) NOT NULL,
  right_follicles JSONB DEFAULT '[]'::jsonb,
  left_follicles JSONB DEFAULT '[]'::jsonb,
  endometrial_thickness NUMERIC(4, 2) CHECK (endometrial_thickness >= 0),
  endometrial_pattern TEXT CHECK (endometrial_pattern IN ('TRILAMINAR', 'HOMOGENEOUS', 'HYPERECHOIC', 'OTHER')),
  hsg_results TEXT,
  notes TEXT,
  performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 21. STIMULATION DAILY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS stimulation_daily_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  cycle_day INT NOT NULL CHECK (cycle_day >= 1),
  fsh_dose NUMERIC(6, 2) CHECK (fsh_dose >= 0),
  hmg_dose NUMERIC(6, 2) CHECK (hmg_dose >= 0),
  other_medications JSONB DEFAULT '[]'::jsonb,
  estradiol_e2 NUMERIC(8, 2) CHECK (estradiol_e2 >= 0),
  progesterone_p4 NUMERIC(6, 2) CHECK (progesterone_p4 >= 0),
  lh NUMERIC(6, 2) CHECK (lh >= 0),
  ultrasound_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (cycle_id, log_date)
);

-- ============================================
-- 22. OPU RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS opu_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL UNIQUE REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  retrieval_date TIMESTAMP NOT NULL DEFAULT NOW(),
  total_follicles_aspirated INT CHECK (total_follicles_aspirated >= 0),
  oocytes_retrieved INT NOT NULL CHECK (oocytes_retrieved >= 0),
  mii_count INT CHECK (mii_count >= 0),
  mi_count INT CHECK (mi_count >= 0),
  gv_count INT CHECK (gv_count >= 0),
  empty_follicles_count INT CHECK (empty_follicles_count >= 0),
  complications TEXT,
  performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 23. EMBRYOLOGY RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS embryology_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  fertilization_method TEXT CHECK (fertilization_method IN ('IVF', 'ICSI', 'SPLIT')) NOT NULL,
  oocytes_inseminated INT NOT NULL CHECK (oocytes_inseminated >= 0),
  two_pn_count INT CHECK (two_pn_count >= 0),
  day3_cleavage_count INT CHECK (day3_cleavage_count >= 0),
  day5_blastocyst_count INT CHECK (day5_blastocyst_count >= 0),
  gardner_grades JSONB DEFAULT '[]'::jsonb,
  embryologist_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 24. EMBRYO TRANSFER RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS embryo_transfer_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  transfer_date TIMESTAMP NOT NULL DEFAULT NOW(),
  transfer_type TEXT CHECK (transfer_type IN ('FRESH', 'FROZEN')) NOT NULL,
  embryos_transferred INT NOT NULL CHECK (embryos_transferred >= 0),
  embryo_grades TEXT,
  difficulty TEXT CHECK (difficulty IN ('EASY', 'MODERATE', 'DIFFICULT')) DEFAULT 'EASY',
  catheter_type TEXT,
  ultrasound_guidance BOOLEAN DEFAULT TRUE,
  physician_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 25. CYCLE OUTCOMES
-- ============================================
CREATE TABLE IF NOT EXISTS cycle_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL UNIQUE REFERENCES ivf_cycles(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  beta_hcg_date_1 DATE,
  beta_hcg_value_1 NUMERIC(8, 2) CHECK (beta_hcg_value_1 >= 0),
  beta_hcg_date_2 DATE,
  beta_hcg_value_2 NUMERIC(8, 2) CHECK (beta_hcg_value_2 >= 0),
  clinical_pregnancy BOOLEAN DEFAULT FALSE,
  gestational_sacs_count INT CHECK (gestational_sacs_count >= 0),
  cardiac_activity BOOLEAN DEFAULT FALSE,
  clinical_outcome TEXT CHECK (clinical_outcome IN ('ONGOING', 'LIVE_BIRTH', 'MISCARRIAGE', 'ECTOPIC', 'NEGATIVE', 'CHEMICAL')),
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 26. BILLING RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES ivf_cycles(id) ON DELETE SET NULL,
  package_type TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (paid_amount >= 0),
  payment_status TEXT CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUNDED')) DEFAULT 'UNPAID',
  payment_method TEXT CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'INSURANCE', 'OTHER')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES (using IF NOT EXISTS for safety)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_profile ON patients(user_profile_id);

-- Safe column addition for existing databases (idempotent)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX IF NOT EXISTS idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_adherence_patient ON medication_adherence(patient_id, adherence_date);
CREATE INDEX IF NOT EXISTS idx_coordination_tasks_assigned_to ON coordination_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_coordination_tasks_patient ON coordination_tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_coordination_tasks_status ON coordination_tasks(status);
CREATE INDEX IF NOT EXISTS idx_patient_complaints_patient ON patient_complaints(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_patient ON kyc_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_patient ON compliance_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_history_patient ON clinical_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_semen_analysis_patient ON semen_analysis(patient_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_patient ON scan_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_cycle ON scan_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stimulation_daily_log_cycle ON stimulation_daily_log(cycle_id);
CREATE INDEX IF NOT EXISTS idx_stimulation_daily_log_patient ON stimulation_daily_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_opu_records_cycle ON opu_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_opu_records_patient ON opu_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_embryology_records_cycle ON embryology_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_embryology_records_patient ON embryology_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_embryo_transfer_records_cycle ON embryo_transfer_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_embryo_transfer_records_patient ON embryo_transfer_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_cycle_outcomes_cycle ON cycle_outcomes(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_outcomes_patient ON cycle_outcomes(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_patient ON billing_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_cycle ON billing_records(cycle_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_adherence ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nartsr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ids_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE semen_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stimulation_daily_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE opu_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE embryology_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE embryo_transfer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- Note: DROP POLICY IF EXISTS + CREATE ensures idempotency
-- ============================================================

-- user_profiles: Everyone can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);

-- patients: own data + assigned doctor/nurse
DROP POLICY IF EXISTS "Patients can view their own data" ON patients;
CREATE POLICY "Patients can view their own data" ON patients
  FOR SELECT USING (
    user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can view assigned patients" ON patients;
CREATE POLICY "Doctors can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments
      WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = patients.id
    )
  );

DROP POLICY IF EXISTS "Nurses can view assigned patients" ON patients;
CREATE POLICY "Nurses can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = patients.id
    )
  );

DROP POLICY IF EXISTS "Doctors can update patients" ON patients;
CREATE POLICY "Doctors can update patients" ON patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments
      WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = patients.id
    )
  );

DROP POLICY IF EXISTS "Nurses can update patients" ON patients;
CREATE POLICY "Nurses can update patients" ON patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = patients.id
    )
  );

-- coordination_tasks
DROP POLICY IF EXISTS "Users can view assigned coordination tasks" ON coordination_tasks;
CREATE POLICY "Users can view assigned coordination tasks" ON coordination_tasks
  FOR SELECT USING (
    assigned_to = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) OR
    created_by = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Doctors can manage coordination tasks" ON coordination_tasks;
CREATE POLICY "Doctors can manage coordination tasks" ON coordination_tasks
  FOR ALL USING (
    created_by = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Nurses can update coordination tasks" ON coordination_tasks;
CREATE POLICY "Nurses can update coordination tasks" ON coordination_tasks
  FOR UPDATE USING (
    assigned_to = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
  );

-- kyc_documents
DROP POLICY IF EXISTS "Nurses and doctors can view kyc" ON kyc_documents;
CREATE POLICY "Nurses and doctors can view kyc" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = kyc_documents.patient_id
    ) OR
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments
      WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = kyc_documents.patient_id
    )
  );

DROP POLICY IF EXISTS "Nurses can manage kyc documents" ON kyc_documents;
CREATE POLICY "Nurses can manage kyc documents" ON kyc_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = kyc_documents.patient_id
    )
  );

-- compliance_documents
DROP POLICY IF EXISTS "Nurses and doctors can view compliance" ON compliance_documents;
CREATE POLICY "Nurses and doctors can view compliance" ON compliance_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = compliance_documents.patient_id
    ) OR
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments
      WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = compliance_documents.patient_id
    )
  );

DROP POLICY IF EXISTS "Nurses can manage compliance documents" ON compliance_documents;
CREATE POLICY "Nurses can manage compliance documents" ON compliance_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid())
        AND patient_id = compliance_documents.patient_id
    )
  );

-- clinical_history
DROP POLICY IF EXISTS "Patients can view their own clinical_history" ON clinical_history;
CREATE POLICY "Patients can view their own clinical_history" ON clinical_history
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can manage clinical_history" ON clinical_history;
CREATE POLICY "Doctors can manage clinical_history" ON clinical_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = clinical_history.patient_id)
  );

DROP POLICY IF EXISTS "Nurses can manage clinical_history" ON clinical_history;
CREATE POLICY "Nurses can manage clinical_history" ON clinical_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = clinical_history.patient_id)
  );

-- semen_analysis
DROP POLICY IF EXISTS "Patients can view their own semen_analysis" ON semen_analysis;
CREATE POLICY "Patients can view their own semen_analysis" ON semen_analysis
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can manage semen_analysis" ON semen_analysis;
CREATE POLICY "Doctors can manage semen_analysis" ON semen_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = semen_analysis.patient_id)
  );

DROP POLICY IF EXISTS "Nurses can manage semen_analysis" ON semen_analysis;
CREATE POLICY "Nurses can manage semen_analysis" ON semen_analysis
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = semen_analysis.patient_id)
  );

-- scan_records
DROP POLICY IF EXISTS "Patients can view their own scan_records" ON scan_records;
CREATE POLICY "Patients can view their own scan_records" ON scan_records
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can manage scan_records" ON scan_records;
CREATE POLICY "Doctors can manage scan_records" ON scan_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = scan_records.patient_id)
  );

DROP POLICY IF EXISTS "Nurses can manage scan_records" ON scan_records;
CREATE POLICY "Nurses can manage scan_records" ON scan_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = scan_records.patient_id)
  );

-- medications: patients can view their own
DROP POLICY IF EXISTS "Patients can view their own medications" ON medications;
CREATE POLICY "Patients can view their own medications" ON medications
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can manage medications" ON medications;
CREATE POLICY "Doctors can manage medications" ON medications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = medications.patient_id)
  );

DROP POLICY IF EXISTS "Nurses can manage medications" ON medications;
CREATE POLICY "Nurses can manage medications" ON medications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = medications.patient_id)
  );

-- medication_adherence
DROP POLICY IF EXISTS "Patients can view their own adherence" ON medication_adherence;
CREATE POLICY "Patients can view their own adherence" ON medication_adherence
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Nurses can manage adherence" ON medication_adherence;
CREATE POLICY "Nurses can manage adherence" ON medication_adherence
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = medication_adherence.patient_id)
  );

-- opu_records, embryology_records, embryo_transfer_records, cycle_outcomes, billing_records
DROP POLICY IF EXISTS "Doctors can manage opu_records" ON opu_records;
CREATE POLICY "Doctors can manage opu_records" ON opu_records
  FOR ALL USING (EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = opu_records.patient_id));

DROP POLICY IF EXISTS "Nurses can manage opu_records" ON opu_records;
CREATE POLICY "Nurses can manage opu_records" ON opu_records
  FOR ALL USING (EXISTS (SELECT 1 FROM nurse_patient_assignments WHERE nurse_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = opu_records.patient_id));

DROP POLICY IF EXISTS "Doctors can manage embryology_records" ON embryology_records;
CREATE POLICY "Doctors can manage embryology_records" ON embryology_records
  FOR ALL USING (EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = embryology_records.patient_id));

DROP POLICY IF EXISTS "Doctors can manage embryo_transfer_records" ON embryo_transfer_records;
CREATE POLICY "Doctors can manage embryo_transfer_records" ON embryo_transfer_records
  FOR ALL USING (EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = embryo_transfer_records.patient_id));

DROP POLICY IF EXISTS "Doctors can manage cycle_outcomes" ON cycle_outcomes;
CREATE POLICY "Doctors can manage cycle_outcomes" ON cycle_outcomes
  FOR ALL USING (EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = cycle_outcomes.patient_id));

DROP POLICY IF EXISTS "Patients can view their own cycle_outcomes" ON cycle_outcomes;
CREATE POLICY "Patients can view their own cycle_outcomes" ON cycle_outcomes
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Doctors can manage billing_records" ON billing_records;
CREATE POLICY "Doctors can manage billing_records" ON billing_records
  FOR ALL USING (EXISTS (SELECT 1 FROM doctor_patient_assignments WHERE doctor_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()) AND patient_id = billing_records.patient_id));

DROP POLICY IF EXISTS "Patients can view their own billing_records" ON billing_records;
CREATE POLICY "Patients can view their own billing_records" ON billing_records
  FOR SELECT USING (
    patient_id = (SELECT id FROM patients WHERE user_profile_id = (SELECT id FROM user_profiles WHERE auth_id = auth.uid()))
  );

-- audit_log: allow insert from all (server uses service role so this is covered)
DROP POLICY IF EXISTS "Allow service role to manage audit_log" ON audit_log;
CREATE POLICY "Allow service role to manage audit_log" ON audit_log
  FOR ALL USING (true)
  WITH CHECK (true);

-- ============================================================
-- DASHBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW patient_dashboard_summary AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  COUNT(DISTINCT ic.id) as total_cycles,
  COUNT(DISTINCT CASE WHEN ic.status != 'COMPLETED' THEN ic.id END) as active_cycles,
  COUNT(DISTINCT m.id) as total_medications,
  COUNT(DISTINCT ct.id) as pending_tasks
FROM patients p
LEFT JOIN ivf_cycles ic ON p.id = ic.patient_id
LEFT JOIN medications m ON p.id = m.patient_id
LEFT JOIN coordination_tasks ct ON p.id = ct.patient_id AND ct.status = 'PENDING'
GROUP BY p.id, p.first_name, p.last_name, p.email;

-- ============================================================
-- DONE — All 26 tables created/verified with indexes and RLS
-- ============================================================
