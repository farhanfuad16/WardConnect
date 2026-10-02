import { useCallback, useEffect, useRef, useState } from "react";
import type { Coords } from "@/lib/geo";
import { getCurrentCoords, getLastKnownCoords, type LocationResult } from "@/lib/location";

export type DeviceLocationStatus = "idle" | "loading" | "ok" | "denied" | "unavailable";

/**
 * Device location for a screen. `coords` may also be set by hand (dropping a
 * pin on the map) via `setCoords`; `source` tells the two apart.
 */
export function useDeviceLocation({ auto = true }: { auto?: boolean } = {}) {
  const [coords, setCoordsState] = useState<Coords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<DeviceLocationStatus>(auto ? "loading" : "idle");
  const [message, setMessage] = useState<string>("");
  const [source, setSource] = useState<"device" | "manual" | null>(null);
  // Counts successful device fixes so a map can re-centre on each new one.
  const [fixCount, setFixCount] = useState(0);
  const alive = useRef(true);

  const refresh = useCallback(async (): Promise<LocationResult | null> => {
    setStatus("loading");
    // Show the phone's recent cached position at once; the GPS fix below replaces it.
    const quick = await getLastKnownCoords();
    if (quick && alive.current) {
      setCoordsState(quick.coords);
      setAccuracy(quick.accuracy);
      setSource("device");
    }
    const result = await getCurrentCoords();
    if (!alive.current) return null;
    if (result.status === "ok") {
      setCoordsState(result.coords);
      setAccuracy(result.accuracy);
      setSource("device");
      setFixCount((n) => n + 1);
      setStatus("ok");
      return result;
    }
    setStatus(result.status);
    setMessage(result.status === "unavailable" ? result.message : "");
    return result;
  }, []);

  const setCoords = useCallback((c: Coords) => {
    setCoordsState(c);
    setAccuracy(null);
    setSource("manual");
    setStatus("ok");
  }, []);

  useEffect(() => {
    alive.current = true;
    if (auto) refresh();
    return () => {
      alive.current = false;
    };
  }, [auto, refresh]);

  return { coords, accuracy, status, message, source, fixCount, refresh, setCoords };
}
