export type Coords = { latitude: number; longitude: number };

// Mirpur, Dhaka — used to centre the map before we know where the user is.
export const DEFAULT_CENTER: Coords = { latitude: 23.8223, longitude: 90.3654 };

/** API rows return decimals as strings ("23.8103000"); null/blank/NaN → undefined. */
export function toCoords(lat?: string | number | null, lng?: string | number | null): Coords | undefined {
  if (lat == null || lng == null || lat === "" || lng === "") return undefined;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

/** Great-circle distance in metres. */
export function distanceMeters(a: Coords, b: Coords): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function formatCoords(c: Coords): string {
  return `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;
}
