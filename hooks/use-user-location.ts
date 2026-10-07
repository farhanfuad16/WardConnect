import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

export type LatLng = { latitude: number; longitude: number };

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export interface UserLocation {
  status: UserLocationStatus;
  coords: LatLng | null;
  accuracy: number | null;
  error: string | null;
  refresh: () => void;
}

// Ward centre used before a fix arrives (and as the fallback if the platform
// refuses to give one), so the map always opens on something sensible.
export const WARD_CENTER: LatLng = {
  latitude: 23.8223,
  longitude: 90.3654,
};

function describe(err: unknown): string {
  const code = (err as { code?: number } | null)?.code;
  if (code === 1) return "Location permission denied.";
  if (code === 2) return "Location unavailable right now.";
  if (code === 3) return "Location request timed out.";
  return err instanceof Error ? err.message : "Could not read your location.";
}

/**
 * Asks for foreground location permission and keeps a single watch on the
 * user's position. `expo-location` wraps the native modules on iOS/Android and
 * the browser Geolocation API on web, so one hook covers every platform.
 *
 * `autoStart` should be false on screens that only need a fix after an
 * explicit tap, so we never prompt for permission on app launch.
 */
export function useUserLocation(options?: { autoStart?: boolean }) {
  const autoStart = options?.autoStart ?? true;

  const [status, setStatus] = useState<UserLocationStatus>("idle");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchId = useRef<Location.LocationSubscription | null>(null);

  const teardown = useCallback(() => {
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    teardown();
    setStatus("requesting");
    setError(null);

    // Browsers only expose geolocation on a secure origin. Serving the web
    // build over a LAN IP (pnpm lan) is http, so fail with a clear message
    // instead of hanging on a prompt that will never resolve.
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.isSecureContext === false
    ) {
      setStatus("unavailable");
      setError(
        "Your browser only shares location over HTTPS. Open the app on localhost or an HTTPS address."
      );
      return;
    }

    if (!Location.hasServicesEnabledAsync) {
      setStatus("unavailable");
      setError("Location services are not available on this device.");
      return;
    }

    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      setStatus("unavailable");
      setError("Turn on location services to show your position.");
      return;
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      setStatus("denied");
      setError(
        "Location permission denied. Enable it in your browser or device settings."
      );
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setAccuracy(position.coords.accuracy ?? null);
      setStatus("granted");
    } catch (err) {
      setStatus("unavailable");
      setError(describe(err));
      return;
    }

    watchId.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 15000 },
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy ?? null);
      }
    );
  }, [teardown]);

  useEffect(() => {
    if (autoStart) void start();
    return teardown;
  }, [autoStart, start, teardown]);

  const refresh = useCallback(() => {
    void start();
  }, [start]);

  return { status, coords, accuracy, error, refresh };
}