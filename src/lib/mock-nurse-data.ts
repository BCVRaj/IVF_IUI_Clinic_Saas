export const nurseStats = [
  {
    id: "s1",
    label: "Total patients today",
    value: "42",
    detail: "+12% vs yest.",
    tone: "primary",
  },
  {
    id: "s2",
    label: "Pending check-ins",
    value: "08",
    detail: "3 urgent",
    tone: "secondary",
  },
  {
    id: "s3",
    label: "Meds due",
    value: "15",
    detail: "within 60m",
    tone: "accent",
  },
] as const;

export const nurseQueue = [
  {
    id: "IVF-9021",
    name: "Sarah Chen",
    stage: "Stimulation: Day 8",
    action: "Ultrasound & Bloodwork",
    priority: "High",
  },
  {
    id: "IVF-8842",
    name: "Elena Rodriguez",
    stage: "Egg Retrieval: Day 0",
    action: "Post-Op Recovery Monitoring",
    priority: "Normal",
  },
  {
    id: "IVF-7210",
    name: "Marcus Thorne",
    stage: "Semen Analysis",
    action: "Verify Sample Labeling",
    priority: "High",
  },
  {
    id: "IVF-6033",
    name: "Jessica Vane",
    stage: "Transfer Prep",
    action: "Progesterone Injection",
    priority: "Normal",
  },
] as const;

export const nurseTimeline = [
  {
    id: "t1",
    time: "09:00 AM",
    place: "Room 4",
    title: "Dr. Singh / Ultrasound",
    patient: "Sarah Chen (In Progress)",
    active: true,
  },
  {
    id: "t2",
    time: "10:15 AM",
    place: "Theatre 1",
    title: "Dr. Reynolds / Retrieval",
    patient: "Elena Rodriguez (Prepping)",
    active: false,
  },
  {
    id: "t3",
    time: "11:00 AM",
    place: "Consult 2",
    title: "Nurse Intake / New Cycle",
    patient: "Chloe Smith (Awaiting)",
    active: false,
  },
] as const;

export const nurseAlerts = [
  {
    id: "a1",
    title: "Lab Value Alert: #IVF-9021",
    body: "E2 levels exceeding 4000 pg/mL. Possible OHSS risk. Notify Dr. Reynolds immediately.",
  },
  {
    id: "a2",
    title: "Consents Missing: #IVF-7210",
    body: "Surgical consent for retrieval not signed. Do not prep for OT until completed.",
  },
] as const;

export const selectedPatient = {
  id: "IVF-9920",
  name: "Elena Rodriguez",
  cycleDay: "DAY 12 OF CYCLE",
};

export const medicationSchedule = [
  {
    id: "m1",
    time: "08:00",
    meridiem: "AM",
    medication: "Gonal-F Redi-ject",
    dosage: "225 IU",
    route: "Subcutaneous",
    notes: "Administer in abdominal quadrant",
    status: "Pending",
  },
  {
    id: "m2",
    time: "10:30",
    meridiem: "AM",
    medication: "Menopur",
    dosage: "75 IU",
    route: "Subcutaneous",
    notes: "Witnessed by: Nurse A. Chen",
    status: "Administered",
  },
  {
    id: "m3",
    time: "02:00",
    meridiem: "PM",
    medication: "Cetrotide 0.25mg",
    dosage: "1 Injection",
    route: "Subcutaneous",
    notes: "Prevents premature ovulation",
    status: "Upcoming",
  },
] as const;

export const wardMeds = [
  {
    id: "w1",
    dueTime: "07:30",
    patient: "Clarissa Wu",
    room: "402-A",
    medication: "Progesterone in Oil",
    dose: "IM / 50mg",
    status: "Urgent",
  },
  {
    id: "w2",
    dueTime: "08:15",
    patient: "Sarah Jenkins",
    room: "305-B",
    medication: "Lupron Trigger",
    dose: "Sub-Q / 40 Units",
    status: "Upcoming",
  },
  {
    id: "w3",
    dueTime: "09:00",
    patient: "Elena Rodriguez",
    room: "412-C",
    medication: "Aspirin Low Dose",
    dose: "Oral / 81mg",
    status: "Ready",
  },
] as const;

export const nurseComplaints = [
  {
    id: "CMP-2023-0042",
    patient: "Elena Hernandez",
    patientId: "IVF-8821",
    category: "Medication",
    severity: "Critical",
    dateReported: "Oct 24, 2026",
    status: "Unresolved",
    complaint:
      "Patient reported severe nausea and localized swelling at injection site following Gonal-F administration.",
  },
  {
    id: "CMP-2023-0059",
    patient: "James Miller",
    patientId: "IVF-9023",
    category: "Facility",
    severity: "Low",
    dateReported: "Oct 24, 2026",
    status: "In Progress",
    complaint: "Extended waiting time before blood draw appointment.",
  },
  {
    id: "CMP-2023-0032",
    patient: "Sarah Chen",
    patientId: "IVF-4412",
    category: "Wait Time",
    severity: "Medium",
    dateReported: "Oct 23, 2026",
    status: "Resolved",
    complaint: "Delay in discharge paperwork and medication explanation.",
  },
] as const;

export const labQueue = [
  {
    id: "l1",
    file: "Estradiol_Serum.pdf",
    patient: "Elena Rodriguez",
    mrn: "8849-B",
    status: "Ready for Review",
    action: "Forward to Doctor",
  },
  {
    id: "l2",
    file: "BetaHCG_Screen.pdf",
    patient: "Sarah Jenkins",
    mrn: "9021-X",
    status: "65% OCR",
    action: "Processing",
  },
  {
    id: "l3",
    file: "Scan_Lab_001.jpg",
    patient: "Unknown",
    mrn: "Unassigned",
    status: "Parsing Error",
    action: "Fix Manually",
  },
] as const;
