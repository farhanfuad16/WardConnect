import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const localFallbackFile = resolve(process.cwd(), ".local-data", "fallback-data.json");
let loadPromise: Promise<void> | undefined;
let saveQueue: Promise<void> = Promise.resolve();

export const defaultWards = [
  { id: 1, name: "Ward 12 · Mirpur", code: "W12" },
  { id: 2, name: "Ward 7 · Dhanmondi", code: "W07" },
  { id: 3, name: "Ward 3 · Gulshan", code: "W03" },
  { id: 4, name: "Ward 9 · Uttara", code: "W09" },
];

export const localUsers: Array<{
  id: number;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string | null;
  wardId: number | null;
  role: "user" | "admin";
  isAdmin: boolean;
  loginMethod: "email" | "manus";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}> = [];

export function getWardName(wardId: number | null): string | null {
  if (wardId == null) return null;
  return defaultWards.find((ward) => ward.id === wardId)?.name ?? null;
}

export function getLocalUserByEmail(email: string) {
  return localUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function getLocalUserById(userId: number) {
  return localUsers.find((user) => user.id === userId);
}

export const defaultNotices = [
  {
    id: 1,
    wardId: 1,
    title: "Waterlogging near Road 7",
    body: "Please avoid Road 7 between the market and community school while response teams clear standing water.",
    category: "Emergency Alert",
    postedBy: 1,
    createdAt: new Date().toISOString(),
    wardName: "Ward 12 · Mirpur",
    postedByName: "Ward Office",
  },
  {
    id: 2,
    wardId: 2,
    title: "Water supply maintenance",
    body: "Water supply may be unavailable from 10 AM–2 PM tomorrow for scheduled maintenance.",
    category: "Utility Notice",
    postedBy: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    wardName: "Ward 7 · Dhanmondi",
    postedByName: "Ward Office",
  },
  {
    id: 3,
    wardId: 3,
    title: "Ward clean-up drive",
    body: "Join the community clean-up drive this Friday at 7 AM from the ward office.",
    category: "General Notice",
    postedBy: 1,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    wardName: "Ward 3 · Gulshan",
    postedByName: "Ward Office",
  },
];

export const defaultIssues: Array<{
  id: number;
  userId: number;
  wardId: number;
  category: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  landmark?: string;
  photoUrl?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  wardName: string;
}> = [
  {
    id: 1,
    userId: 1,
    wardId: 2,
    category: "Waterlogging",
    title: "Standing water near the mosque gate",
    description: "Water has accumulated beside the mosque gate and is blocking foot traffic after heavy rain.",
    status: "in_progress",
    severity: "normal",
    landmark: "Near the community mosque",
    photoUrl: undefined,
    latitude: "23.8223",
    longitude: "90.3654",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    userName: "Demo User",
    wardName: "Ward 7 · Dhanmondi",
  },
  {
    id: 2,
    userId: 1,
    wardId: 1,
    category: "Streetlight",
    title: "Broken streetlight on Road 4",
    description: "The streetlight at the east entrance has been out for three nights and needs repair.",
    status: "acknowledged",
    severity: "normal",
    landmark: "Road 4 East Entrance",
    photoUrl: undefined,
    latitude: "23.8240",
    longitude: "90.3671",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    userName: "Demo User",
    wardName: "Ward 12 · Mirpur",
  },
];

export function loadLocalFallbackData(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const content = await readFile(localFallbackFile, "utf8");
        const saved = JSON.parse(content) as {
          users?: Array<(typeof localUsers)[number]>;
          issues?: typeof defaultIssues;
        };

        if (Array.isArray(saved.users)) {
          localUsers.splice(
            0,
            localUsers.length,
            ...saved.users.map((user) => ({
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              lastSignedIn: new Date(user.lastSignedIn),
            })),
          );
        }
        if (Array.isArray(saved.issues)) {
          defaultIssues.splice(0, defaultIssues.length, ...saved.issues);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error("[Local fallback] Failed to load saved data:", error);
        }
      }
    })();
  }
  return loadPromise;
}

export function saveLocalFallbackData(): Promise<void> {
  saveQueue = saveQueue.catch(() => undefined).then(async () => {
    await mkdir(dirname(localFallbackFile), { recursive: true });
    const temporaryFile = `${localFallbackFile}.${process.pid}.tmp`;
    await writeFile(
      temporaryFile,
      JSON.stringify({ users: localUsers, issues: defaultIssues }, null, 2),
      "utf8",
    );
    await rename(temporaryFile, localFallbackFile);
  });
  return saveQueue;
}

export const defaultIncidents = [
  {
    id: 1,
    wardId: 1,
    title: "Flooded section near Road 7",
    category: "Flood",
    severity: "High",
    description: "Standing water has affected the roadside and pedestrian access. Ward response teams are active.",
    status: "Response started",
    accent: "#D9485F",
    latitude: "23.8223",
    longitude: "90.3654",
    verifiedBy: 1,
    createdAt: new Date().toISOString(),
    wardName: "Ward 12 · Mirpur",
  },
  {
    id: 2,
    wardId: 2,
    title: "Blocked drain at Market Lane",
    category: "Waterlogging",
    severity: "Medium",
    description: "A blocked drain is causing slow water flow after rainfall.",
    status: "Team dispatched",
    accent: "#D97706",
    latitude: "23.8240",
    longitude: "90.3671",
    verifiedBy: 1,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    wardName: "Ward 7 · Dhanmondi",
  },
];

export const defaultResources = [
  {
    id: 1,
    wardId: 1,
    name: "Mirpur Community Ambulance",
    category: "Ambulance",
    contactInfo: "999 / 01700 112233",
    address: "Ward Office, Road 4",
    description: "Emergency ambulance support for the ward.",
    createdAt: new Date().toISOString(),
    wardName: "Ward 12 · Mirpur",
  },
  {
    id: 2,
    wardId: 2,
    name: "Ward Response Team",
    category: "Responder",
    contactInfo: "01700 445566",
    address: "Ward 7 Office",
    description: "Local ward emergency response team.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    wardName: "Ward 7 · Dhanmondi",
  },
];

export const defaultNotifications = [
  {
    id: 1,
    userId: 1,
    title: "Ward update",
    body: "A new emergency notice has been published for your ward.",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

export const defaultSosAlerts = [
  {
    id: 1,
    userId: 1,
    wardId: 1,
    type: "Medical",
    status: "pending",
    note: "Urgent medical support requested.",
    latitude: "23.8223",
    longitude: "90.3654",
    createdAt: new Date().toISOString(),
    userName: "Demo User",
    wardName: "Ward 12 · Mirpur",
  },
];

export const defaultVolunteers = [
  {
    id: 1,
    userId: 1,
    wardId: 1,
    skillsOrInterest: "First aid and community support",
    status: "approved",
    createdAt: new Date().toISOString(),
    userName: "Demo User",
    wardName: "Ward 12 · Mirpur",
  },
];
