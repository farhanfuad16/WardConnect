import { useCallback, useMemo, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { WARD_CENTER, type LatLng } from "@/hooks/use-user-location";

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

const SPAN_FALLBACK = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

function toRegion(center: LatLng) {
  return { ...center, ...SPAN_FALLBACK };
}

/**
 * Native (iOS/Android) map built on react-native-maps. The web build resolves
 * `ward-map.web.tsx` instead, which renders the same props through Leaflet —
 * keep the two in sync when changing this prop list.
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
  const scheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const lastCenter = useRef<LatLng | null>(null);

  const center = userLocation ?? WARD_CENTER;
  const initialRegion = useMemo(() => toRegion(center), [center]);

  const recenter = useCallback(() => {
    const target = userLocation ?? WARD_CENTER;
    lastCenter.current = target;
    mapRef.current?.animateToRegion(toRegion(target), 350);
  }, [userLocation]);

  const handleUserLocationChange = useCallback(() => {
    if (!followUser || !userLocation) return;
    const last = lastCenter.current;
    if (
      last &&
      last.latitude === userLocation.latitude &&
      last.longitude === userLocation.longitude
    ) {
      return;
    }
    lastCenter.current = userLocation;
    mapRef.current?.animateToRegion(toRegion(userLocation), 350);
  }, [followUser, userLocation]);

  const mapStyle = scheme === "dark" ? ("dark" as const) : ("light" as const);

  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onUserLocationChange={handleUserLocationChange}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        loadingEnabled={loading}
        userInterfaceStyle={mapStyle}
      >
        {userLocation && accuracyMeters ? (
          <Circle
            center={userLocation}
            radius={Math.max(accuracyMeters, 20)}
            fillColor="rgba(15, 118, 110, 0.14)"
            strokeColor="rgba(15, 118, 110, 0.4)"
            strokeWidth={1}
          />
        ) : null}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            identifier={String(marker.id)}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            onPress={() => {
              mapRef.current?.animateToRegion(toRegion(marker), 300);
              onMarkerPress?.(marker.id);
            }}
          >
            <View style={[styles.pin, { backgroundColor: marker.color }]} />
          </Marker>
        ))}

        {userLocation ? (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userDot} />
          </Marker>
        ) : null}
      </MapView>

      <Pressable
        onPress={recenter}
        accessibilityRole="button"
        accessibilityLabel="Centre on my location"
        style={styles.recenter}
      >
        <IconSymbol name="location.fill" size={19} color="#0F766E" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", overflow: "hidden" },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0F766E",
    borderWidth: 3,
    borderColor: "#FFFFFF",
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