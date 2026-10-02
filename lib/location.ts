import { Platform } from "react-native";
import * as Location from "expo-location";
import type { Coords } from "@/lib/geo";

export type LocationResult =
  | { status: "ok"; coords: Coords; accuracy: number | null }
  | { status: "denied" }
  | { status: "unavailable"; message: string };

const TIMEOUT_MS = 12000;

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

    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timed out getting your position")), TIMEOUT_MS)),
    ]);
    return {
      status: "ok",
      coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      accuracy: pos.coords.accuracy ?? null,
    };
  } catch (err: any) {
    return { status: "unavailable", message: err?.message || "Location is unavailable on this device" };
  }
}
