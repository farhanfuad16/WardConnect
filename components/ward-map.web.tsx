import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type * as Leaflet from "leaflet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WARD_CENTER, type LatLng } from "@/hooks/use-user-location";

import "leaflet/dist/leaflet.css";

export type WardMapMarker = {
  id: string | number;
  latitude: number;
  longitude: number;
  color: string;
  title?: string;
  description?: string;
};

export type WardMapProps = {
  userLocation?: LatLng | null;
  accuracyMeters?: number | null;
  markers?: WardMapMarker[];
  followUser?: boolean;
  height?: number;
  radius?: number;
  loading?: boolean;
  onMarkerPress?: (id: string | number) => void;
};

const ZOOM = 15;
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const USER_COLOR = "#0F766E";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Web build of WardMap. react-native-maps has no web renderer, so the PC build
 * renders the same props and the same markers through Leaflet on OpenStreetMap
 * tiles instead. Keep this prop list in sync with `ward-map.tsx`.
 *
 * Everything Leaflet touches lives in an effect: `web.output` is "static", so
 * the first render pass happens in Node where `window` does not exist.
 */
export default function WardMap({
  userLocation = null,
  accuracyMeters = null,
  markers = [],
  followUser = true,
  height = 210,
  radius = 19,
  loading = false,
  onMarkerPress,
}: WardMapProps) {
  const hostRef = useRef<View>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const accuracyRef = useRef<Leaflet.Circle | null>(null);
  const userRef = useRef<Leaflet.CircleMarker | null>(null);
  const incidentRefs = useRef<Leaflet.CircleMarker[]>([]);
  const leafletRef = useRef<typeof Leaflet | null>(null);

  // Latest props for the map callbacks, which Leaflet invokes outside React.
  const live = useRef({ markers, onMarkerPress });
  live.current = { markers, onMarkerPress };

  const markersKey = useMemo(
    () =>
      markers
        .map((m) => `${m.id}:${m.latitude}:${m.longitude}:${m.color}:${m.title ?? ""}`)
        .join("|"),
    [markers]
  );

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;

    void (async () => {
      const L: typeof Leaflet = (await import("leaflet")).default ?? (await import("leaflet"));
      // react-native-web renders View as a real <div>, which is what Leaflet
      // needs to attach to.
      const host = hostRef.current as unknown as HTMLElement | null;
      if (cancelled || !host) return;

      const instance = L.map(host, {
        center: [WARD_CENTER.latitude, WARD_CENTER.longitude],
        zoom: ZOOM,
        zoomControl: true,
        attributionControl: true,
      });
      map = instance;
      leafletRef.current = L;
      mapRef.current = instance;

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(instance);

      const initial = userLocation ?? WARD_CENTER;
      instance.whenReady(() => {
        instance.setView([initial.latitude, initial.longitude], ZOOM);
      });
    })();

    return () => {
      cancelled = true;
      leafletRef.current = null;
      mapRef.current = null;
      accuracyRef.current = null;
      userRef.current = null;
      incidentRefs.current = [];
      map?.remove();
    };
    // Mount-only: the effects below own every later position/marker change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    for (const pin of incidentRefs.current) pin.remove();
    incidentRefs.current = live.current.markers.map((marker) => {
      const pin = L.circleMarker([marker.latitude, marker.longitude], {
        radius: 9,
        color: "#FFFFFF",
        weight: 3,
        fillColor: marker.color,
        fillOpacity: 1,
      });
      const label = marker.title
        ? `<strong>${escapeHtml(marker.title)}</strong>`
        : `Incident ${marker.id}`;
      pin.bindTooltip(label, { direction: "top", offset: [0, -8] });
      pin.on("click", () => live.current.onMarkerPress?.(marker.id));
      pin.addTo(map);
      return pin;
    });
  }, [markersKey]);

  const latitude = userLocation?.latitude ?? null;
  const longitude = userLocation?.longitude ?? null;

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || latitude === null || longitude === null) return;

    if (!userRef.current) {
      accuracyRef.current = L.circle([latitude, longitude], {
        radius: Math.max(accuracyMeters ?? 30, 20),
        color: "rgba(15, 118, 110, 0.4)",
        weight: 1,
        fillColor: "rgba(15, 118, 110, 0.14)",
        fillOpacity: 1,
      }).addTo(map);
      userRef.current = L.circleMarker([latitude, longitude], {
        radius: 7,
        color: "#FFFFFF",
        weight: 3,
        fillColor: USER_COLOR,
        fillOpacity: 1,
      }).addTo(map);
    } else {
      userRef.current.setLatLng([latitude, longitude]);
      accuracyRef.current?.setLatLng([latitude, longitude]);
    }

    if (accuracyRef.current) {
      accuracyRef.current.setRadius(Math.max(accuracyMeters ?? 30, 20));
    }

    if (followUser) map.panTo([latitude, longitude], { animate: true });
  }, [latitude, longitude, accuracyMeters, followUser]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const target = userLocation ?? WARD_CENTER;
    map.flyTo([target.latitude, target.longitude], ZOOM, { duration: 0.4 });
  }, [userLocation]);

  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <View ref={hostRef} style={styles.host} />
      {loading ? <View style={styles.overlay} pointerEvents="none" /> : null}
      <Pressable
        onPress={recenter}
        accessibilityRole="button"
        accessibilityLabel="Centre on my location"
        style={styles.recenter}
      >
        <IconSymbol name="location.fill" size={19} color={USER_COLOR} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", overflow: "hidden" },
  host: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  recenter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7E5",
  },
});