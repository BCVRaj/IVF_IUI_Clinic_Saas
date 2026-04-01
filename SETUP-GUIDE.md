# 🚀 Complete Setup Guide - IVF System

**Status:** Ready for final deployment

---

## ✅ What's Already Done

1. ✅ **Code bug fixed** - Changed `acknowledgment_time` → `acknowledged_at` in 2 files
   - `src/app/api/doctor/tasks/route.ts` (lines 18, 238)
   - `src/app/(protected)/doctor/nurse-coordination/page.tsx` (lines 22, 207)

2. ✅ **3 Seed scripts created** - Ready to populate demo data
   - `scripts/seed-doctors.ts` - Creates demo doctors
   - `scripts/seed-nurses.ts` - Creates demo nurses
   - `scripts/seed-patients.ts` - Creates demo patients

---

## 📋 REMAINING STEPS (MUST DO IN THIS ORDER)

### **STEP 1: Deploy Database Schema to Supabase** (5 minutes)

**Why:** Creates all 17 tables, indexes, and security policies

1. Go to: https://app.supabase.com
2. Select your project: `ivf-clinic`
3. Click: **SQL Editor** (left sidebar)
4. Click: **[New Query]** button
5. Open file: `src/lib/database-schema-fixed.sql`
6. Copy all content: `Ctrl + A`, `Ctrl + C`
7. Paste into Supabase editor: `Ctrl + V`
8. Click: **[Run]** button (blue button, bottom right)
9. Wait for: ✅ **Success** message
10. Verify: You should see **17 tables created**

**Expected output:**
```
✅ Success
Created: user_profiles, patients, doctor_patient_assignments, 
nurse_patient_assignments, ivf_cycles, cycle_milestones, medications, 
medication_adherence, appointments, medical_results, coordination_tasks, 
patient_complaints, cryo_samples, alerts, audit_log, access_logs, 
+ indexes + RLS policies
```

---

### **STEP 2: Deploy Doctors to Database** (2 minutes)

**Why:** Creates 2 demo doctors who can assign tasks

```bash
cd c:\Users\chand\Desktop\IVF\ivf
npx ts-node scripts/seed-doctors.ts
```

**Expected output:**
```
🏥 Starting doctor seeding...

✅ Doctor created: Rajesh Sharma (doctor.rajesh@clinic.com)
   Profile ID: [uuid]
   Password: DemoDoc@123

✅ Doctor created: Priya Gupta (doctor.priya@clinic.com)
   Profile ID: [uuid]
   Password: DemoDoc@123

✅ Doctor seeding complete!
```

---

### **STEP 3: Deploy Nurses to Database** (2 minutes)

**Why:** Creates 3 demo nurses who receive tasks

```bash
npx ts-node scripts/seed-nurses.ts
```

**Expected output:**
```
👩‍⚕️  Starting nurse seeding...

✅ Nurse created: Anjali Patel (nurse.anjali@clinic.com)
   Profile ID: [uuid]
   Password: DemoNurse@123

✅ Nurse created: Maya Singh (nurse.maya@clinic.com)
   Profile ID: [uuid]
   Password: DemoNurse@123

✅ Nurse created: Sneha Verma (nurse.sneha@clinic.com)
   Profile ID: [uuid]
   Password: DemoNurse@123

✅ Nurse seeding complete!
```

---

### **STEP 4: Deploy Patients to Database** (2 minutes)

**Why:** Creates 3 demo patients who have IVF cycles

```bash
npx ts-node scripts/seed-patients.ts
```

**Expected output:**
```
🤰 Starting patient seeding...

✅ Patient created: Rekha Desai (patient.rekha@example.com)
   Patient ID: IVF-XXXX
   DOB: 1990-05-15
   Blood Type: O+
   Password: DemoPatient@123

✅ Patient created: Meera Kapoor (patient.meera@example.com)
   Patient ID: IVF-XXXX
   DOB: 1992-08-22
   Blood Type: B+
   Password: DemoPatient@123

✅ Patient created: Simran Iyer (patient.simran@example.com)
   Patient ID: IVF-XXXX
   DOB: 1988-12-10
   Blood Type: AB+
   Password: DemoPatient@123

🎉 All demo data has been created!
```

---

## 🧪 TEST THE COMPLETE WORKFLOW

### **Start your app**
```bash
npm run dev
```

### **Access the app**
```
http://localhost:3000
```

### **Test flow: Doctor assigns task to nurse**

1. **Login as doctor:**
   - Email: `doctor.rajesh@clinic.com`
   - Password: `DemoDoc@123`

2. **Navigate to:** Doctor Dashboard → Nurse Coordination

3. **Assign task:**
   - Patient: Select `Rekha Desai` (or any patient)
   - Nurse: Select `Anjali Patel` (or any nurse)
   - Task: Select `Oocyte Trigger Injection - HCG`
   - Due Date: Pick any date
   - Click: **[Assign Task]**

4. **Expected result:** ✅ Success message - "Task created and assigned to nurse"

5. **Verify task appears on nurse dashboard:**
   - Logout (click logout button)
   - Login as nurse:
     - Email: `nurse.anjali@clinic.com`
     - Password: `DemoNurse@123`
   - Navigate to: Nurse Dashboard
   - You should SEE the task assigned by doctor ✅

6. **Nurse acknowledges task:**
   - Click task acknowledgment button
   - Status should change from "PENDING" to "ACKNOWLEDGED"

---

## 🔒 Security Notes

**These credentials are DEMO ONLY:**
- All passwords are visible in seed scripts (intentional for demo)
- All data is fake/test data
- In production: Use environment variables, never hardcode credentials
- All seeded users already have `email_confirm: true` (can login immediately)

---

## 📊 What Each File Does (NO OVERLAP)

| File | Creates | Affects |
|------|---------|---------|
| seed-doctors.ts | 2 doctors in user_profiles | Nothing else |
| seed-nurses.ts | 3 nurses in user_profiles | Nothing else |
| seed-patients.ts | 3 patients (user_profiles + patients table) | Nothing else |

**Important:** All scripts check for existing data and skip duplicates. Safe to run multiple times.

---

## ❌ If Something Goes Wrong

### Error: "Database not found"
- Schema not deployed yet (do STEP 1 first)

### Error: "Missing Supabase credentials"
- Check `.env.local` has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Cannot assign task" or "Nurse not found"
- Seed scripts not run (do STEPS 2-4)

### Error: "column acknowledged_at does not exist"
- Schema not deployed (do STEP 1)
- This should be fixed now since we updated the code ✅

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Database schema deployed to Supabase (17 tables created)
- [ ] 2 doctors created and can login
- [ ] 3 nurses created and can login
- [ ] 3 patients created
- [ ] Doctor can assign task to nurse
- [ ] Nurse dashboard shows assigned task
- [ ] Nurse can acknowledge task
- [ ] No database errors in browser console

---

## 🎯 Next Actions

Once verified:
1. Start building production features
2. Replace demo credentials with real users
3. Set up proper authentication/authorization
4. Deploy to production when ready

---

**Questions?** Check the error logs in:
- Browser console: DevTools → Console
- Terminal output: Where you ran `npm run dev`
- Supabase logs: Dashboard → Logs

