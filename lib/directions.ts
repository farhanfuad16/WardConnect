import { Linking } from "react-native";
import type { Coords } from "@/lib/geo";

/** Opens turn-by-turn directions in the platform's maps app / Google Maps on web. */
export function openDirections(to: Coords) {
  return Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${to.latitude},${to.longitude}`,
  );
}
