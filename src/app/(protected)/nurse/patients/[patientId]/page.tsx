"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, Eye } from "lucide-react";
import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  onboarding_status: string;
  nartsr_id?: string;
  id_document_type?: string;
  id_document_number?: string;
  medical_visa_status?: string;
  marriage_cert_verified?: boolean;
  medical_history?: any;
};

export default function NursePatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [nartsrId, setNartsrId] = useState("");
  const [saving, setSaving] = useState(false);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kycUploading, setKycUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    // We can reuse the doctor endpoint since it fetches patient details
    fetch(`/api/doctor/patients/${patientId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setPatient(json.data);
        if (json.data?.nartsr_id) {
          setNartsrId(json.data.nartsr_id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    fetch(`/api/nurse/patients/${patientId}/compliance`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setComplianceDocs(json.data);
      });

    fetch(`/api/nurse/patients/${patientId}/kyc`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setKycDocs(json.data);
      });
  }, [patientId]);

  const handleVerify = async (approveKyc: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nartsrId: nartsrId || null,
          approveKyc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic UI update
      setPatient((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nartsr_id: nartsrId || prev.nartsr_id,
          onboarding_status: approveKyc ? "CLEARED" : prev.onboarding_status,
          marriage_cert_verified: approveKyc ? true : prev.marriage_cert_verified,
        };
      });

      if (approveKyc) {
        // Always redirect back to queue after KYC approval so queue re-fetches fresh data
        router.push("/nurse/verification");
      } else {
        alert("Registry ID saved successfully!");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAlarm = async (docName: string) => {
    if (!confirm(`Send upload request for ${docName} to patient?`)) return;
    
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: docName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Alarm notification sent to patient for ${docName}.`);
    } catch (err: any) {
      alert("Error sending alarm: " + err.message);
    }
  };

  const handleKycUpload = async (docType: string, file: File) => {
    setKycUploading(docType);
    try {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", file);

      const res = await fetch(`/api/nurse/patients/${patientId}/kyc`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh KYC docs
      setKycDocs((prev) => {
        const filtered = prev.filter((d) => d.doc_type !== docType);
        return [data.data, ...filtered];
      });
    } catch (err: any) {
      alert("Upload error: " + err.message);
    } finally {
      setKycUploading(null);
    }
  };

  const handleKycVerify = async (documentId: string, status: "VERIFIED" | "REJECTED") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setKycDocs((prev) =>
        prev.map((d) => (d.id === documentId ? data.data : d))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadConsent = async (formType: string) => {
    const url = prompt(`Please enter the URL for the signed ${formType}:`);
    if (!url) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType, fileUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComplianceDocs((prev) => [data.data, ...prev]);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyConsent = async (documentId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/nurse/patients/${patientId}/compliance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, status: "VERIFIED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComplianceDocs((prev) =>
        prev.map((doc) => (doc.id === documentId ? data.data : doc))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading patient profile...</div>;
  }

  if (error || !patient) {
    return <div className="text-red-500 bg-red-50 p-4 rounded-xl">{error || "Patient not found."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/nurse/verification"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Queue
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-sm text-slate-500">ID: {patient.id}</p>
        </div>
        <StatusBadge 
          label={patient.onboarding_status.replace(/_/g, " ")} 
          tone={patient.onboarding_status === "CLEARED" ? "success" : patient.onboarding_status === "PENDING_VERIFICATION" ? "warning" : "danger"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consent Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            CONSENT STATUS
          </h2>
          <div className="space-y-2">
            {[
              {
                id: "FORM_6",
                label: "Form 6 (General Consent)",
                doc: complianceDocs.find((d) => d.form_type === "FORM_6"),
              },
              {
                id: "FORM_7",
                label: "Form 7 (Husband Semen)",
                doc: complianceDocs.find((d) => d.form_type === "FORM_7"),
              },
              {
                id: "FORM_8",
                label: "Form 8 (Donor Semen)",
                doc: complianceDocs.find((d) => d.form_type === "FORM_8"),
              },
              {
                id: "FORM_12",
                label: "Form 12 (OPU Consent)",
                doc: complianceDocs.find((d) => d.form_type === "FORM_12"),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-700">{item.label}</span>
                <div className="flex items-center gap-3">
                  {item.doc?.status === "VERIFIED" ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                      Verified
                    </span>
                  ) : item.doc?.status === "PENDING" ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      Pending Verification
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      Missing
                    </span>
                  )}

                  {item.doc ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 gap-1 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => window.open(item.doc.file_url, "_blank")}>
                        <Eye className="size-3.5" /> View
                      </Button>
                      {item.doc.status === "PENDING" && (
                        <Button variant="outline" size="sm" className="h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleVerifyConsent(item.doc.id)} disabled={saving}>
                          Verify
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => handleUploadConsent(item.id)} disabled={saving}>
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Identity Documents / KYC Upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            IDENTITY DOCUMENTS (KYC)
          </h2>
          <div className="space-y-3">
            {[
              { docType: "AADHAAR", label: "Aadhaar Card" },
              { docType: "PAN", label: "PAN Card" },
              { docType: "PASSPORT", label: "Passport" },
              { docType: "MARRIAGE_CERTIFICATE", label: "Marriage Certificate" },
            ].map(({ docType, label }) => {
              const doc = kycDocs.find((d) => d.doc_type === docType);
              const isUploading = kycUploading === docType;
              return (
                <div
                  key={docType}
                  className="rounded-lg bg-slate-50 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{label}</span>
                    <div className="flex items-center gap-2">
                      {doc?.status === "VERIFIED" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">Verified</span>
                      ) : doc?.status === "PENDING" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Pending</span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">Missing</span>
                      )}

                      {doc && doc.file_url && !doc.file_url.startsWith("placeholder://") && (
                        <Button variant="outline" size="sm" className="h-7 gap-1 border-teal-200 text-teal-700 hover:bg-teal-50" onClick={() => window.open(doc.file_url, "_blank")}>
                          <Eye className="size-3.5" /> View
                        </Button>
                      )}
                      {doc?.status === "PENDING" && (
                        <>
                          <Button variant="outline" size="sm" className="h-7 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleKycVerify(doc.id, "VERIFIED")} disabled={saving}>✓ Verify</Button>
                          <Button variant="outline" size="sm" className="h-7 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleKycVerify(doc.id, "REJECTED")} disabled={saving}>✗ Reject</Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File upload row */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <span className="inline-flex w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        {isUploading ? "Uploading…" : doc ? "Re-upload" : "Choose file to upload"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        disabled={isUploading || saving}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleKycUpload(docType, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {patient.onboarding_status !== "CLEARED" && (
            <div className="mt-6">
              <Button
                onClick={() => handleVerify(true)}
                disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                Approve KYC &amp; Clear Patient
              </Button>
            </div>
          )}
        </div>

        {/* NARTSR Integration Hub (Full width at bottom) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            NARTSR Integration Hub
          </h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed max-w-3xl">
            Register this patient in the official National ART & Surrogacy Registry portal. 
            Once registered, paste the generated Registry ID below to unlock IVF Cycle creation.
          </p>

          <div className="flex items-end gap-4 max-w-xl">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                National Registry ID (NARTSR)
              </label>
              <input
                type="text"
                value={nartsrId}
                onChange={(e) => setNartsrId(e.target.value)}
                placeholder="e.g., NART-2026-XYZ"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <Button 
              onClick={() => handleVerify(false)} 
              disabled={saving || !nartsrId}
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              Save Registry ID
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
