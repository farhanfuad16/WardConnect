import { Platform } from "react-native";
import * as Location from "expo-location";
import type { Coords } from "@/lib/geo";

export type LocationResult =
  | { status: "ok"; coords: Coords; accuracy: number | null }
  | { status: "denied" }
  | { status: "unavailable"; message: string };

const TIMEOUT_MS = 15000;
// A cached fix younger than this is good enough to show while GPS warms up.
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * One-shot device position. Never throws: SOS and report submission must not
 * be blocked by a location failure, so callers just branch on `status`.
 * On web this uses the browser Geolocation API, which only works on https or
 * localhost — on a phone hitting http://<lan-ip> it reports "unavailable".
 */
export async function getCurrentCoords(): Promise<LocationResult> {
  // Browsers hide the Geolocation/Permissions APIs entirely on insecure pages,
  // which surfaces as a confusing "navigator.permissions is not available".
  if (Platform.OS === "web" && typeof window !== "undefined" && window.isSecureContext === false) {
    return { status: "unavailable", message: "Your browser only shares location on secure (https) pages, and this page is http." };
  }
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return { status: "denied" };

    if (Platform.OS !== "web" && !(await Location.hasServicesEnabledAsync())) {
      return { status: "unavailable", message: "Location (GPS) is turned off on this phone. Turn it on in quick settings and try again." };
    }

    // High = GPS. Balanced often returns a Wi-Fi/cell estimate hundreds of metres off.
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timed out getting your position")), TIMEOUT_MS)),
    ]);
    return toResult(pos);
  } catch (err: any) {
    // GPS can be slow indoors; a recent cached fix beats no location at all.
    const cached = await getLastKnownCoords();
    if (cached) return cached;
    return { status: "unavailable", message: err?.message || "Location is unavailable on this device" };
  }
}

/**
 * The phone's most recent cached position, if it is fresh. Returns instantly
 * (no GPS wait), so screens can show it while getCurrentCoords() refines it.
 * Never prompts for permission and returns null on web or on any failure.
 */
export async function getLastKnownCoords(): Promise<Extract<LocationResult, { status: "ok" }> | null> {
  if (Platform.OS === "web") return null;
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== "granted") return null;
    const pos = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
    return pos ? toResult(pos) : null;
  } catch {
    return null;
  }
}

function toResult(pos: Location.LocationObject): Extract<LocationResult, { status: "ok" }> {
  return {
    status: "ok",
    coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
    accuracy: pos.coords.accuracy ?? null,
  };
}
