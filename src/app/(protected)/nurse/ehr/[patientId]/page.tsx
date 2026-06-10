"use client";

/**
 * Nurse EHR View — read-only wrapper around the shared PatientEHRPage component.
 *
 * Renders exactly the same 11-tab EHR as the doctor portal, but with:
 *   - "Mark as Cleared" button hidden
 *   - "+ Prescribe New" button hidden
 *   - Back link pointing to /nurse/dashboard
 *
 * Data is fetched from the existing /api/doctor/patients/[patientId] endpoint
 * (the nurse patient details page already uses this same endpoint — see
 * src/app/(protected)/nurse/patients/[patientId]/page.tsx line 44).
 */
import PatientEHRPage from "@/app/(protected)/doctor/ehr/[patientId]/page";

export default function NurseEHRPage() {
  return <PatientEHRPage isNurseView={true} />;
}
