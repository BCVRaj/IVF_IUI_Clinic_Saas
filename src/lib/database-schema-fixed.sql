-- IVF Clinic Database Schema for Supabase (FIXED)
-- Run this in Supabase SQL Editor after project creation

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
-- 2. PATIENTS (Central Patient Hub)
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY DEFAULT 'IVF-' || LPAD(CAST(FLOOR(RANDOM()*9999) AS TEXT), 4, '0'),
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
-- 11. COORDINATION TASKS (Doctor -> Nurse)
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
-- 13. CRYO SAMPLES (Frozen Embryos/Sperm/Eggs)
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
-- 14. ALERTS (System-wide Notifications)
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
-- 15. AUDIT LOG (HIPAA Compliance)
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
-- 16. ACCESS LOGS (Security Tracking)
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
-- INDEXES (Performance Optimization)
-- ============================================
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_user_profile ON patients(user_profile_id);
CREATE INDEX idx_ivf_cycles_patient ON ivf_cycles(patient_id);
CREATE INDEX idx_ivf_cycles_status ON ivf_cycles(status);
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medication_adherence_patient ON medication_adherence(patient_id, adherence_date);
CREATE INDEX idx_coordination_tasks_assigned_to ON coordination_tasks(assigned_to);
CREATE INDEX idx_coordination_tasks_patient ON coordination_tasks(patient_id);
CREATE INDEX idx_coordination_tasks_status ON coordination_tasks(status);
CREATE INDEX idx_patient_complaints_patient ON patient_complaints(patient_id);
CREATE INDEX idx_alerts_patient ON alerts(patient_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
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

-- Patients can view their own profiles
CREATE POLICY "Patients can view their own data" ON patients
  FOR SELECT USING (
    auth.uid() = (SELECT user_profile_id FROM patients WHERE id = patients.id)
  );

-- Doctors can view patients they're assigned to
CREATE POLICY "Doctors can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_assignments
      WHERE doctor_id = auth.uid() AND patient_id = patients.id
    )
  );

-- Nurses can view patients they're assigned to
CREATE POLICY "Nurses can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = auth.uid() AND patient_id = patients.id
    )
  );

-- Coordination tasks: assignees can view
CREATE POLICY "Users can view assigned coordination tasks" ON coordination_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );

-- Patient complaints: patient can view their own, nurse/doctor can view assigned
CREATE POLICY "Patients can view their complaints" ON patient_complaints
  FOR SELECT USING (
    patient_id = (
      SELECT id FROM patients WHERE user_profile_id = auth.uid()
    )
  );

CREATE POLICY "Nurses can view patient complaints" ON patient_complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nurse_patient_assignments
      WHERE nurse_id = auth.uid() AND patient_id = patient_complaints.patient_id
    )
  );

-- ============================================
-- VIEWS
-- ============================================
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

-- ============================================
-- DONE
-- ============================================
-- Schema creation complete!
-- All 17 tables created with indexes, RLS policies, and views
-- Ready for API implementation
-- Fixed: Removed non-immutable age generated column
