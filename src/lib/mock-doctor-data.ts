export const doctorStats = [
  { id: "d1", label: "Patients Today", value: "42", detail: "+12% vs LW", tone: "navy" },
  { id: "d2", label: "Critical Cases", value: "03", detail: "Requires intervention", tone: "red" },
  { id: "d3", label: "Pending Lab Reviews", value: "14", detail: "75% throughput", tone: "teal" },
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

export const doctorAlerts = [
  {
    id: "al1",
    title: "Trigger Shot Window",
    patient: "Patient Sarah J.",
    message:
      "E2 levels confirmed at 3,200 pg/mL. Follicle growth meets criteria. Scheduled trigger: 22:30 tonight.",
    severity: "critical",
  },
  {
    id: "al2",
    title: "Missing PGT-A Results",
    patient: "Cycle Batch #4421-B",
    message:
      "5 blastocysts pending chromosomal screening from external lab. Expected yesterday at 17:00.",
    severity: "urgent",
  },
] as const;

export const coordinationTasks = {
  pending: [
    {
      id: "t1",
      patient: "Miller, Amara (#8829)",
      task: "Oocyte Trigger Injection - HCG 10k IU",
      priority: "Critical",
      due: "22:30 PM",
    },
    {
      id: "t2",
      patient: "Tanaka, Kenji (#9102)",
      task: "Sperm Analysis Collection",
      priority: "Normal",
      due: "Tomorrow 08:00 AM",
    },
  ],
  progress: [
    {
      id: "t3",
      patient: "Smith, Linda (#7741)",
      task: "Baseline Ultrasound - CD 2",
      priority: "Normal",
      due: "Started 12m ago",
    },
    {
      id: "t4",
      patient: "Garcia, Elena (#6380)",
      task: "AMH + FSH Blood Panel",
      priority: "High",
      due: "Started 4m ago",
    },
  ],
  done: [
    {
      id: "t5",
      patient: "Gomez, Maria (#1102)",
      task: "STAT Bloodwork - Estradiol Levels",
      priority: "High",
      due: "Completed 09:14 AM",
    },
    {
      id: "t6",
      patient: "Wu, Hana (#7204)",
      task: "Progesterone Injection",
      priority: "Normal",
      due: "Completed 08:45 AM",
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
