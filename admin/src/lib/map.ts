/** OpenStreetMap link for a saved location. Coordinates arrive from the API as decimal strings. */
export function osmLink(lat: string | number, lng: string | number): string {
  const la = Number(lat);
  const lo = Number(lng);
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}`;
}

export function hasCoords(lat: string | null | undefined, lng: string | null | undefined): boolean {
  return lat != null && lng != null && lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}
