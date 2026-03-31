"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComplaintsConsole } from "@/components/nurse/complaints-console";

export default function NurseComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/patient/complaints");
        if (!response.ok) throw new Error("Failed to fetch complaints");
        const data = await response.json();
        setComplaints(data.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error fetching complaints");
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchComplaints, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter by search term
  const filteredComplaints = complaints.filter((c: any) =>
    c.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 bg-background text-on-surface">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Complaint Registry
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Patient satisfaction and incident management console. View both patient-submitted complaints and nurse-recorded issues.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="rounded-lg bg-surface border border-surface-dim/50 py-2 pl-9 pr-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              placeholder="Search Patient ID or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-none font-bold uppercase text-xs tracking-wider">
            Filter
          </Button>
        </div>
      </header>

      {loading && <p className="text-sm text-on-surface-variant">Loading complaints...</p>}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}
      
      {!loading && filteredComplaints.length > 0 && (
        <ComplaintsConsole complaints={filteredComplaints} />
      )}
      
      {!loading && filteredComplaints.length === 0 && !error && (
        <p className="text-sm text-on-surface-variant">No complaints found.</p>
      )}
    </div>
  );
}
