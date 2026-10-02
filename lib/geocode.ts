import type { Coords } from "./geo";

/**
 * Place search ("Banani", "Kafrul market") via MapTiler Geocoding, using the
 * same EXPO_PUBLIC_MAPTILER_KEY as the map tiles. Without a key, search is
 * simply unavailable (`placeSearchAvailable` is false).
 */
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || "";

export const placeSearchAvailable = MAPTILER_KEY !== "";

export type Place = { id: string; name: string; coords: Coords };

export async function searchPlaces(query: string, near?: Coords | null, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (!placeSearchAvailable || q.length < 2) return [];
  const params = new URLSearchParams({ key: MAPTILER_KEY, language: "en", country: "bd", limit: "5", autocomplete: "true" });
  // Rank results near the user (or the current pin) first
  if (near) params.set("proximity", `${near.longitude},${near.latitude}`);
  const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?${params}`, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = await res.json();
  return (data.features ?? []).flatMap((f: any) => {
    const [longitude, latitude] = f.center ?? [];
    if (typeof latitude !== "number" || typeof longitude !== "number") return [];
    return [{ id: String(f.id), name: String(f.place_name ?? f.text ?? q), coords: { latitude, longitude } }];
  });
}
