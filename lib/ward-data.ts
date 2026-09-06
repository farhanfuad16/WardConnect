export type ReportStatus = "submitted" | "acknowledged" | "in_progress" | "resolved" | "rejected";
export type NoticeCategory = "Emergency Alert" | "Utility Notice" | "General Notice";

export type WardReport = {
  id: string;
  category: string;
  description: string;
  date: string;
  status: ReportStatus;
  severity: "normal" | "emergency";
  landmark?: string;
  location: string;
  timeline: { label: string; time: string; done: boolean }[];
};

export type Notice = {
  id: string;
  category: NoticeCategory;
  title: string;
  message: string;
  date: string;
};

export type Incident = {
  id: string;
  title: string;
  category: string;
  severity: "High" | "Medium" | "Low";
  location: string;
  description: string;
  status: string;
  accent: string;
};

export const currentUser = {
  name: "Ayesha Rahman",
  email: "ayesha@example.com",
  phone: "+880 1712 345 678",
  ward: "Ward 12 · Mirpur",
};

export const reports: WardReport[] = [
  {
    id: "WRD-2026-000124",
    category: "Waterlogging",
    description: "Standing water is blocking the footpath beside the community school.",
    date: "Today, 9:18 AM",
    status: "in_progress",
    severity: "normal",
    landmark: "Near Mirpur Community School",
    location: "23.8223, 90.3654",
    timeline: [
      { label: "Reported", time: "9:18 AM", done: true },
      { label: "Acknowledged", time: "9:42 AM", done: true },
      { label: "In progress", time: "10:15 AM", done: true },
      { label: "Resolved", time: "", done: false },
    ],
  },
  {
    id: "WRD-2026-000118",
    category: "Streetlight",
    description: "The streetlight at the east entrance has been out for three nights.",
    date: "Yesterday, 7:46 PM",
    status: "acknowledged",
    severity: "normal",
    location: "23.8240, 90.3671",
    timeline: [
      { label: "Reported", time: "Yesterday, 7:46 PM", done: true },
      { label: "Acknowledged", time: "Yesterday, 8:02 PM", done: true },
      { label: "In progress", time: "", done: false },
      { label: "Resolved", time: "", done: false },
    ],
  },
];

export const notices: Notice[] = [
  { id: "n1", category: "Emergency Alert", title: "Waterlogging near Road 7", message: "Please avoid Road 7 between the market and community school while response teams clear standing water.", date: "Today, 10:20 AM" },
  { id: "n2", category: "Utility Notice", title: "Water supply maintenance", message: "Water supply may be unavailable from 10 AM–2 PM tomorrow for scheduled maintenance.", date: "Yesterday, 4:10 PM" },
  { id: "n3", category: "General Notice", title: "Ward clean-up drive", message: "Join the community clean-up drive this Friday at 7 AM from the ward office.", date: "18 Aug 2026" },
];

export const incidents: Incident[] = [
  { id: "i1", title: "Flooded section near Road 7", category: "Flood", severity: "High", location: "Road 7 · Mirpur", description: "Standing water has affected the roadside and pedestrian access. Ward response teams are active.", status: "Response started", accent: "#D9485F" },
  { id: "i2", title: "Blocked drain at Market Lane", category: "Waterlogging", severity: "Medium", location: "Market Lane · Mirpur", description: "A blocked drain is causing slow water flow after rainfall.", status: "Team dispatched", accent: "#D97706" },
  { id: "i3", title: "Road repair works", category: "Road Damage", severity: "Low", location: "East entrance · Ward 12", description: "Repair work is underway. Please use the alternate footpath.", status: "Work in progress", accent: "#0F766E" },
];

export const resources = [
  { name: "Mirpur Community Ambulance", category: "Ambulance", contact: "999 / 01700 112233", location: "Ward Office, Road 4" },
  { name: "Ward Response Team", category: "Responder", contact: "01700 445566", location: "Ward 12 Office" },
  { name: "Community Generator", category: "Generator", contact: "01700 778899", location: "Community Centre" },
  { name: "Emergency Shelter", category: "Shelter", contact: "01700 334455", location: "Mirpur Community School" },
];

export const statusLabel: Record<ReportStatus, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
