export const doctorStats = [
  { id: "d1", label: "Patients Today", value: "42", detail: "+12% vs LW", tone: "navy" },
  { id: "d2", label: "Critical Cases", value: "03", detail: "Requires intervention", tone: "red" },
  { id: "d3", label: "Pending Patients KYC", value: "14", detail: "75% throughput", tone: "teal" },
  { id: "d4", label: "Active IVF Cycles", value: "28", detail: "Across all units", tone: "dark" },
] as const;

export const doctorSchedule = [
  {
    id: "IVF-9921",
    name: "Sarah Jenkins",
    cycleDay: "Day 12",
    stage: "Stimulation",
    lastScan: "Oct 23, 08:30 AM",
  },
  {
    id: "IVF-8840",
    name: "Elena Rodriguez",
    cycleDay: "Day 14",
    stage: "Trigger Ready",
    lastScan: "Oct 24, 07:15 AM",
  },
  {
    id: "IVF-7712",
    name: "Michael & Anna Smith",
    cycleDay: "Day 5",
    stage: "Embryo Culture",
    lastScan: "Oct 22, 11:45 AM",
  },
  {
    id: "IVF-9102",
    name: "Jessica Thompson",
    cycleDay: "Day 19",
    stage: "Luteal Support",
    lastScan: "Oct 24, 09:00 AM",
  },
] as const;

// Critical alerts visible to both Doctor AND Nurse
export const doctorAlerts = [
  {
    id: "al1",
    patientId: "IVF-9021",
    patientName: "Sarah J.",
    title: "Trigger Shot Window",
    patient: "Patient Sarah J.",
    message:
      "E2 levels confirmed at 3,200 pg/mL. Follicle growth meets criteria. Scheduled trigger: 22:30 tonight.",
    severity: "critical",
    visibleToNurse: true,
    createdAt: "Oct 24, 2026 • 14:30",
  },
  {
    id: "al2",
    patientId: "IVF-4421-B",
    patientName: "Batch #4421-B",
    title: "Missing PGT-A Results",
    patient: "Cycle Batch #4421-B",
    message:
      "5 blastocysts pending chromosomal screening from external lab. Expected yesterday at 17:00.",
    severity: "urgent",
    visibleToNurse: true,
    createdAt: "Oct 24, 2026 • 13:15",
  },
] as const;

// Enhanced coordination tasks with nurse assignment and cross-role visibility
export const coordinationTasks = {
  pending: [
    {
      id: "t1",
      patientId: "IVF-8829",
      patientName: "Miller, Amara",
      task: "Oocyte Trigger Injection - HCG 10k IU",
      priority: "Critical",
      due: "22:30 PM",
      assignedNurse: "Nurse Elena Rodriguez",
      assignedNurseId: "nurse_001",
      status: "pending",
      createdBy: "Dr. S. Miller",
      acknowledged: false,
      acknowledgmentTime: null,
    },
    {
      id: "t2",
      patientId: "IVF-9102",
      patientName: "Tanaka, Kenji",
      task: "Sperm Analysis Collection",
      priority: "Normal",
      due: "Tomorrow 08:00 AM",
      assignedNurse: "Nurse James Wilson",
      assignedNurseId: "nurse_002",
      status: "pending",
      createdBy: "Dr. S. Miller",
      acknowledged: false,
      acknowledgmentTime: null,
    },
  ],
  progress: [
    {
      id: "t3",
      patientId: "IVF-7741",
      patientName: "Smith, Linda",
      task: "Baseline Ultrasound - CD 2",
      priority: "Normal",
      due: "Started 12m ago",
      assignedNurse: "Nurse Sarah Chen",
      assignedNurseId: "nurse_003",
      status: "in-progress",
      createdBy: "Dr. S. Miller",
      acknowledged: true,
      acknowledgmentTime: "10:30 AM",
    },
    {
      id: "t4",
      patientId: "IVF-6380",
      patientName: "Garcia, Elena",
      task: "AMH + FSH Blood Panel",
      priority: "High",
      due: "Started 4m ago",
      assignedNurse: "Nurse Elena Rodriguez",
      assignedNurseId: "nurse_001",
      status: "in-progress",
      createdBy: "Dr. L. Kaufman",
      acknowledged: true,
      acknowledgmentTime: "09:45 AM",
    },
  ],
  done: [
    {
      id: "t5",
      patientId: "IVF-1102",
      patientName: "Gomez, Maria",
      task: "STAT Bloodwork - Estradiol Levels",
      priority: "High",
      due: "Completed 09:14 AM",
      assignedNurse: "Nurse James Wilson",
      assignedNurseId: "nurse_002",
      status: "completed",
      createdBy: "Dr. L. Kaufman",
      acknowledged: true,
      acknowledgmentTime: "08:30 AM",
      completedTime: "09:14 AM",
    },
    {
      id: "t6",
      patientId: "IVF-7204",
      patientName: "Wu, Hana",
      task: "Progesterone Injection",
      priority: "Normal",
      due: "Completed 08:45 AM",
      assignedNurse: "Nurse Sarah Chen",
      assignedNurseId: "nurse_003",
      status: "completed",
      createdBy: "Dr. S. Miller",
      acknowledged: true,
      acknowledgmentTime: "08:15 AM",
      completedTime: "08:45 AM",
    },
  ],
} as const;

export const criticalPatients = [
  {
    id: "IVF-9021",
    name: "Sarah Miller",
    risk: "OHSS Risk: Grade III - Severe",
    severity: "Critical",
    updated: "2m ago",
  },
  {
    id: "IVF-8842",
    name: "Jessica Chen",
    risk: "Lab Alert: Progesterone < 10",
    severity: "Urgent",
    updated: "14m ago",
  },
  {
    id: "IVF-7210",
    name: "Maria Garcia",
    risk: "Beta HCG: Stalled Progression",
    severity: "Urgent",
    updated: "45m ago",
  },
] as const;

export const criticalVitals = [
  { metric: "BP", value: "145/95", status: "Elevated" },
  { metric: "Heart Rate", value: "88 bpm", status: "Normal" },
  { metric: "Temp", value: "37.2°C", status: "Normal" },
  { metric: "O2 Sat", value: "98%", status: "Stable" },
] as const;

export const criticalLabs = [
  { parameter: "Estradiol (E2)", current: "4,820 pg/mL", previous: "3,150 pg/mL", trend: "up" },
  { parameter: "Progesterone", current: "1.2 ng/mL", previous: "1.1 ng/mL", trend: "flat" },
  { parameter: "Hematocrit", current: "48.2%", previous: "41.5%", trend: "up" },
  { parameter: "Follicle Count (>18mm)", current: "18 Units", previous: "14 Units", trend: "up" },
] as const;

export const cycleTimeline = [
  "Day 1",
  "Day 4",
  "Day 7",
  "Day 9",
  "Today",
  "Trigger",
  "Retrieval",
] as const;

export const hormoneSeries = {
  e2: [20, 35, 45, 65, 90],
  p4: [10, 12, 15, 18, 22],
  lh: [20, 18, 22, 25, 28],
};

export const embryoRows = [
  { id: "#EMB-001", d1: "2PN", d3: "8-Cell Grade A", d5: "Expanded", d6: "4AA" },
  { id: "#EMB-002", d1: "2PN", d3: "Fragmentation 20%", d5: "Delayed", d6: "3BC" },
  { id: "#EMB-003", d1: "2PN", d3: "10-Cell Grade A", d5: "Hatching", d6: "5AB" },
] as const;

export const labBoardColumns = {
  received: [
    {
      id: "#IVF-2024-8842",
      title: "PGT-A Screening",
      date: "OCT 24, 08:30 AM",
      tech: "M. ARCHER",
      priority: "STAT",
    },
    {
      id: "#IVF-2024-9102",
      title: "Semen Analysis",
      date: "OCT 24, 09:15 AM",
      tech: "J. KOA",
      priority: "ROUTINE",
    },
  ],
  processing: [
    {
      id: "#IVF-2024-8701",
      title: "Oocyte Denudation",
      stage: "STAGES 2/4",
      incubator: "UNIT-07-A",
      tech: "S. VANCE",
      progress: 50,
    },
    {
      id: "#IVF-2024-8019",
      title: "ICSI Procedure",
      stage: "STAGES 3/4",
      incubator: "UNIT-04-D",
      tech: "A. THORNE",
      progress: 75,
    },
  ],
  ready: [
    {
      id: "#IVF-2024-7721",
      title: "PGT-SR Comprehensive",
      readyAt: "10:45 AM",
      tech: "D. ROSS",
    },
    {
      id: "#IVF-2024-8114",
      title: "Embryo Grading (Day 5)",
      readyAt: "09:12 AM",
      tech: "S. VANCE",
    },
  ],
  reviewed: [
    {
      id: "#IVF-2024-7001",
      title: "Final Biopsy Report",
      signoff: "DR. L. KAUFMAN • OCT 23",
    },
  ],
} as const;

export const cryoTanks = [
  {
    id: "TANK-04",
    temp: "-196°C",
    capacity: 62.5,
    alert: false,
    occupied: 5,
  },
  {
    id: "TANK-05",
    temp: "-192°C",
    capacity: 87.5,
    alert: true,
    occupied: 7,
  },
  {
    id: "TANK-06",
    temp: "-196°C",
    capacity: 12.5,
    alert: false,
    occupied: 1,
  },
  {
    id: "TANK-07",
    temp: "-196°C",
    capacity: 50,
    alert: false,
    occupied: 4,
  },
] as const;

export const cryoSamples = [
  {
    id: "IVF-2024-8842",
    patient: "Elena Rodriguez",
    specimen: "Embryo (D5)",
    grade: "4AA",
    location: "TK-04-C2-S12",
    freezeDate: "Oct 12, 2026",
    status: "Stored",
  },
  {
    id: "IVF-2023-1192",
    patient: "Julian Mercer",
    specimen: "Sperm",
    grade: "MOT: 40%",
    location: "TK-07-C1-S05",
    freezeDate: "Jan 04, 2026",
    status: "Processing",
  },
  {
    id: "IVF-2024-5510",
    patient: "Sarah Jenkins",
    specimen: "Oocyte",
    grade: "MII",
    location: "TK-04-C4-S01",
    freezeDate: "Mar 21, 2026",
    status: "Thawed",
  },
  {
    id: "IVF-2024-7721",
    patient: "Aria Vogel",
    specimen: "Embryo (D6)",
    grade: "5AB",
    location: "TK-05-C2-S09",
    freezeDate: "Feb 15, 2026",
    status: "Stored",
  },
] as const;

export const aiEmbryos = [
  {
    id: "E-001",
    score: 94,
    grade: "4AA",
    fragmentation: 2.4,
    recommended: true,
  },
  {
    id: "E-002",
    score: 81,
    grade: "3AB",
    fragmentation: 8.1,
    recommended: false,
  },
  {
    id: "E-003",
    score: 76,
    grade: "3BB",
    fragmentation: 12.5,
    recommended: false,
  },
  {
    id: "E-004",
    score: 69,
    grade: "2BC",
    fragmentation: 18.2,
    recommended: false,
  },
] as const;

export const aiReasoning =
  "Embryo E-001 demonstrates superior inner cell mass compactness and cohesive trophectoderm architecture. Fragmentation remains below 3%, suggesting high implantation potential with stable metabolic profile.";

export const labReportExtractedValues = [
  { marker: "Estradiol (E2)", current: "1452 pg/mL", previous: "842 pg/mL", range: "200 - 2500" },
  { marker: "Progesterone", current: "1.2 ng/mL", previous: "0.9 ng/mL", range: "< 1.5" },
  { marker: "LH", current: "3.8 mIU/mL", previous: "4.1 mIU/mL", range: "1.0 - 12.0" },
] as const;

export const labReportTrend = [15, 25, 40, 60, 78] as const;

// ── Clinic-wide mock cycles for the tabbed dashboard ──────────────────────────
export const mockCycles = [
  // ── Investigation (PLANNING) ────────────────────────────────────────────────
  {
    id: "cyc-001",
    patient_id: "pt-101",
    patientName: "Amara Miller",
    age: 32,
    protocol: "Antagonist",
    status: "PLANNING",
    start_date: "2026-07-01",
    cycleDay: "CD 2",
    investigations: [
      { name: "AMH", value: "2.4 ng/mL", status: "Completed", flag: false },
      { name: "FSH", value: "7.8 mIU/mL", status: "Completed", flag: false },
      { name: "Estradiol (E2)", value: "—", status: "Pending", flag: false },
      { name: "TSH", value: "—", status: "Pending", flag: false },
      { name: "Antral Follicle Count", value: "—", status: "Booked", flag: false },
    ],
  },
  {
    id: "cyc-002",
    patient_id: "pt-102",
    patientName: "Kenji Tanaka",
    age: 36,
    protocol: "Long Lupron",
    status: "PLANNING",
    start_date: "2026-06-28",
    cycleDay: "CD 5",
    investigations: [
      { name: "AMH", value: "1.1 ng/mL", status: "Completed", flag: true },
      { name: "FSH", value: "12.4 mIU/mL", status: "Completed", flag: true },
      { name: "Estradiol (E2)", value: "58 pg/mL", status: "Completed", flag: false },
      { name: "TSH", value: "2.1 µIU/mL", status: "Completed", flag: false },
      { name: "Semen Analysis", value: "—", status: "Pending", flag: false },
    ],
  },
  // ── Ovarian Stimulation (STIMULATION) ───────────────────────────────────────
  {
    id: "cyc-003",
    patient_id: "pt-103",
    patientName: "Sarah Jenkins",
    age: 29,
    protocol: "Antagonist",
    status: "STIMULATION",
    start_date: "2026-06-22",
    cycleDay: "Day 8",
    stimulation: {
      e2: [210, 480, 1100, 2300, 3200],
      lh: [2, 2, 3, 4, 3],
      p4: [0.4, 0.5, 0.6, 0.7, 0.8],
      leftFollicles: [10, 12, 14, 15],
      rightFollicles: [11, 13, 15, 16],
      leadFollicle: "16 mm",
      triggerReady: false,
    },
  },
  {
    id: "cyc-004",
    patient_id: "pt-104",
    patientName: "Elena Rodriguez",
    age: 34,
    protocol: "Mini IVF",
    status: "STIMULATION",
    start_date: "2026-06-20",
    cycleDay: "Day 10",
    stimulation: {
      e2: [180, 420, 980, 2100, 4200],
      lh: [3, 3, 4, 6, 5],
      p4: [0.5, 0.6, 0.7, 0.9, 1.1],
      leftFollicles: [14, 16, 18, 19],
      rightFollicles: [12, 14, 16, 17],
      leadFollicle: "19 mm",
      triggerReady: true,
    },
  },
  // ── Egg Pickup / OPU (RETRIEVAL) ────────────────────────────────────────────
  {
    id: "cyc-005",
    patient_id: "pt-105",
    patientName: "Linda Smith",
    age: 31,
    protocol: "Antagonist",
    status: "RETRIEVAL",
    start_date: "2026-06-18",
    cycleDay: "Day 14",
    retrieval: {
      scheduledAt: "2026-07-03 08:30",
      totalFollicles: 14,
      eggsRetrieved: 11,
      matureOocytes: 9,
      anaesthesia: "General",
      embryologist: "Dr. S. Vance",
    },
  },
  {
    id: "cyc-006",
    patient_id: "pt-106",
    patientName: "Hana Wu",
    age: 28,
    protocol: "PPOS",
    status: "RETRIEVAL",
    start_date: "2026-06-19",
    cycleDay: "Day 13",
    retrieval: {
      scheduledAt: "2026-07-03 10:00",
      totalFollicles: 8,
      eggsRetrieved: null,
      matureOocytes: null,
      anaesthesia: "Conscious Sedation",
      embryologist: "Dr. A. Thorne",
    },
  },
  // ── Embryology (FERTILIZATION) ───────────────────────────────────────────────
  {
    id: "cyc-007",
    patient_id: "pt-107",
    patientName: "Maria Garcia",
    age: 38,
    protocol: "Antagonist",
    status: "FERTILIZATION",
    start_date: "2026-06-17",
    cycleDay: "Day 1",
    embryology: {
      method: "ICSI",
      oocytesInjected: 8,
      fertilized: 6,
      embryos: [
        { id: "#EMB-001", d1: "2PN", d3: "8-Cell A", d5: "Expanded", d6: "4AA", status: "Excellent" },
        { id: "#EMB-002", d1: "2PN", d3: "6-Cell B", d5: "Blastocyst", d6: "3BB", status: "Good" },
        { id: "#EMB-003", d1: "1PN", d3: "Arrested", d5: "—", d6: "—", status: "Poor" },
      ],
    },
  },
  {
    id: "cyc-008",
    patient_id: "pt-108",
    patientName: "Anna Chen",
    age: 33,
    protocol: "Long Lupron",
    status: "EMBRYO_CULTURE",
    start_date: "2026-06-15",
    cycleDay: "Day 3",
    embryology: {
      method: "Conventional IVF",
      oocytesInjected: 10,
      fertilized: 8,
      embryos: [
        { id: "#EMB-011", d1: "2PN", d3: "8-Cell A", d5: "Hatching", d6: "5AB", status: "Excellent" },
        { id: "#EMB-012", d1: "2PN", d3: "8-Cell A", d5: "Expanded", d6: "4AA", status: "Excellent" },
        { id: "#EMB-013", d1: "2PN", d3: "Fragmented", d5: "Delayed", d6: "3BC", status: "Fair" },
      ],
    },
  },
  // ── Embryo Freezing (FREEZING) ───────────────────────────────────────────────
  {
    id: "cyc-009",
    patient_id: "pt-109",
    patientName: "Jessica Thompson",
    age: 35,
    protocol: "Antagonist",
    status: "FREEZING",
    start_date: "2026-06-10",
    cycleDay: "Day 7",
    freezing: {
      totalBlastocysts: 5,
      frozen: 4,
      discarded: 1,
      vitrificationDate: "2026-07-01",
      pgtStatus: "PGT-A Pending",
      storageTank: "TANK-04-C2",
    },
  },
  // ── Embryo Transfer (TRANSFER) ───────────────────────────────────────────────
  {
    id: "cyc-010",
    patient_id: "pt-110",
    patientName: "Aria Vogel",
    age: 30,
    protocol: "FET",
    status: "TRANSFER",
    start_date: "2026-06-01",
    cycleDay: "Transfer Day",
    transfer: {
      scheduledAt: "2026-07-03 14:00",
      endometriumThickness: "9.2 mm",
      embryoGrade: "5AB",
      embryosToTransfer: 1,
      lutealSupport: "Progesterone 400mg BD",
      catheter: "Soft Cook",
    },
  },
  {
    id: "cyc-011",
    patient_id: "pt-111",
    patientName: "Priya Nair",
    age: 37,
    protocol: "FET",
    status: "TRANSFER",
    start_date: "2026-06-02",
    cycleDay: "Transfer Day",
    transfer: {
      scheduledAt: "2026-07-03 15:30",
      endometriumThickness: "8.6 mm",
      embryoGrade: "4AA",
      embryosToTransfer: 1,
      lutealSupport: "Progesterone 400mg BD + Estradiol 6mg",
      catheter: "Wallace Classic",
    },
  },
  // ── Outcome (OUTCOME_PENDING) ────────────────────────────────────────────────
  {
    id: "cyc-012",
    patient_id: "pt-112",
    patientName: "Rebecca Stone",
    age: 39,
    protocol: "Antagonist",
    status: "OUTCOME_PENDING",
    start_date: "2026-05-15",
    cycleDay: "14 DPT",
    outcome: {
      betaHCGDate: "2026-07-03",
      betaHCG: null,
      result: "Awaiting",
      previousBeta: null,
      ultrasoundDate: null,
      clinicalPregnancy: null,
    },
  },
  {
    id: "cyc-013",
    patient_id: "pt-113",
    patientName: "Diana Foster",
    age: 33,
    protocol: "FET",
    status: "OUTCOME_PENDING",
    start_date: "2026-05-20",
    cycleDay: "9 DPT",
    outcome: {
      betaHCGDate: "2026-07-08",
      betaHCG: 142,
      result: "Positive",
      previousBeta: 68,
      ultrasoundDate: "2026-07-22",
      clinicalPregnancy: null,
    },
  },
] as const;
