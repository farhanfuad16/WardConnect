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
  // MapTiler only returns landmarks (universities, hospitals, shops: "poi") when
  // asked for them explicitly, so search areas/roads and landmarks side by side.
  const [areas, landmarks] = await Promise.all([geocode(q, near, signal), geocode(q, near, signal, "poi")]);
  const merged: Place[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < Math.max(areas.length, landmarks.length); i++) {
    for (const p of [landmarks[i], areas[i]]) {
      const key = p?.name.toLowerCase();
      if (p && key && !seen.has(key)) {
        seen.add(key);
        merged.push(p);
      }
    }
  }
  // Exact name first ("Banani" the area before "Banani Graveyard"), then prefix matches
  const ql = q.toLowerCase();
  const rank = (p: Place) => {
    const head = p.name.split(",")[0].trim().toLowerCase();
    return head === ql ? 0 : head.startsWith(ql) ? 1 : 2;
  };
  return merged
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p)
    .slice(0, 6);
}

async function geocode(q: string, near: Coords | null | undefined, signal: AbortSignal | undefined, types?: string): Promise<Place[]> {
  const params = new URLSearchParams({ key: MAPTILER_KEY, language: "en", country: "bd", limit: "4", autocomplete: "true" });
  if (types) params.set("types", types);
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
