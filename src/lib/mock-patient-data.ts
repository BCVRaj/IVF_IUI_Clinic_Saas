export const patientUser = {
  name: "Sarah Williams",
  initials: "SW",
  cycleName: "October Protocol",
};

export const patientCycleSteps = [
  { label: "Consultation", status: "done" },
  { label: "Stimulation", status: "active" },
  { label: "Retrieval", status: "upcoming" },
  { label: "Transfer", status: "upcoming" },
  { label: "Result", status: "upcoming" },
] as const;

export const patientUpcomingAppointment = {
  dateLabel: "Oct 12, 2026",
  timeLabel: "09:30 AM",
  weekday: "Thursday",
  type: "Ultrasound & Bloodwork Monitoring",
  doctor: "Dr. S. Miller",
  specialty: "Lead Reproductive Endocrinologist",
};

export const patientRecentLabReports = [
  { id: "r1", name: "Estradiol (E2)", date: "Oct 10, 2026", status: "Ready" },
  { id: "r2", name: "LH Serum", date: "Oct 10, 2026", status: "Ready" },
  { id: "r3", name: "Progesterone", date: "Today, 08:45 AM", status: "Pending" },
] as const;

export const todaysMedications = [
  {
    id: "m1",
    name: "Gonal-F Redi-ject",
    dose: "300 IU",
    route: "Subcutaneous Injection",
    time: "08:00 AM",
    status: "taken",
    note: "Confirmed at 08:05 AM",
  },
  {
    id: "m2",
    name: "Menopur",
    dose: "75 IU",
    route: "Mixed Injection",
    time: "09:00 PM",
    status: "upcoming",
  },
  {
    id: "m3",
    name: "Cetrotide",
    dose: "0.25 mg",
    route: "Injection",
    time: "09:00 PM",
    status: "upcoming",
  },
] as const;

export const appointmentTimeSlots = [
  "08:30 AM",
  "09:00 AM",
  "10:30 AM",
  "11:15 AM",
  "01:00 PM",
  "02:45 PM",
  "03:30 PM",
] as const;

export const pastAppointments = [
  { id: "a1", title: "Initial Ultrasound Scan", date: "Sep 22, 2026", doctor: "Dr. Miller", status: "Completed" },
  { id: "a2", title: "Consultation Call", date: "Aug 10, 2026", doctor: "Video Appointment", status: "Cancelled" },
  { id: "a3", title: "Blood Panel Screening", date: "Jul 05, 2026", doctor: "Labs Main Wing", status: "Completed" },
] as const;

export const weeklyAdherence = 92;

export const medicationHistory = [
  { id: "h1", date: "Jun 12, 2026", time: "07:15 AM", medication: "Gonal-F", dose: "300 IU", status: "Completed" },
  { id: "h2", date: "Jun 11, 2026", time: "08:45 PM", medication: "Menopur", dose: "75 IU", status: "Completed" },
  { id: "h3", date: "Jun 11, 2026", time: "08:30 PM", medication: "Prenatal Vitamin", dose: "1 Tab", status: "Completed" },
  { id: "h4", date: "Jun 11, 2026", time: "07:30 AM", medication: "Gonal-F", dose: "300 IU", status: "Missed" },
] as const;

export const complaints = [
  {
    id: "IVF-9842",
    title: "Severe nausea following morning Menopur injection",
    datetime: "Oct 24, 2026 • 09:15 AM",
    status: "Open",
    severity: "4/5",
    category: "Side Effects",
    description:
      "Experiencing significant dizziness and nausea about 30 minutes after the injection. Tried ginger tea but it has not subsided yet.",
    response: "Awaiting physician review. Please rest in a cool room and stay hydrated.",
  },
  {
    id: "IVF-9711",
    title: "Mild localized swelling at the injection site",
    datetime: "Oct 21, 2026 • 02:30 PM",
    status: "Resolved",
    severity: "2/5",
    category: "Skin Reaction",
    description: "Small red bump, slightly itchy. No fever or spreading redness.",
    response:
      "This is a normal reaction. You can apply a cold compress for 10 minutes. Contact us if redness spreads.",
  },
  {
    id: "IVF-9685",
    title: "Feeling overwhelmed and anxious about next scan",
    datetime: "Oct 18, 2026 • 08:00 PM",
    status: "Resolved",
    severity: "3/5",
    category: "Emotional",
    description: "Hard to focus on work today with persistent anxiety and tension in shoulders.",
    response:
      "Counseling support is available. We also shared guided breathing resources in your dashboard.",
  },
] as const;

export const uploadedReports = [
  { id: "u1", name: "Hormonal Profile", date: "Sept 12, 2026", status: "Reviewed", reviewer: "Dr. Aris Thorne" },
  { id: "u2", name: "Semen Analysis", date: "Sept 20, 2026", status: "Processing", reviewer: "Estimated: 24h" },
  { id: "u3", name: "Follicle Scan Data", date: "Aug 28, 2026", status: "Reviewed", reviewer: "Dr. Sarah Chen" },
] as const;
