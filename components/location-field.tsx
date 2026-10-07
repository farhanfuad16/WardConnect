import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LeafletMap } from "@/components/leaflet-map";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";
import type { useDeviceLocation } from "@/hooks/use-device-location";
import { formatCoords } from "@/lib/geo";

type Props = {
  device: ReturnType<typeof useDeviceLocation>;
  /** Show a map so the user can tap / drag to correct the position. */
  adjustable?: boolean;
  mapHeight?: number;
  /** What the location is for, shown when it has been captured. */
  attachedText?: string;
};

export function LocationField({ device, adjustable = false, mapHeight = 170, attachedText = "Attached to your submission." }: Props) {
  const { C, s } = useAppStyles(makeStyles);
  const { coords, status, accuracy, source, message } = device;

  let icon: "location.fill" | "exclamationmark.triangle.fill" = "location.fill";
  let tone = C.teal;
  let title = "Location ready";
  let text = attachedText;

  if (status === "loading") {
    title = "Finding your location…";
    text = "Allow location access if your device asks.";
  } else if (status === "ok" && coords) {
    title = source === "manual" ? "Pin placed on the map" : "Current location found";
    text = `${formatCoords(coords)}${accuracy ? `  ·  ±${Math.round(accuracy)} m` : ""}`;
  } else if (status === "denied") {
    icon = "exclamationmark.triangle.fill";
    tone = C.amber;
    title = "Location permission is off";
    text = adjustable ? "Allow it in settings, or tap the map to drop a pin." : "Allow it in your device settings so responders can find you.";
  } else if (status === "unavailable") {
    icon = "exclamationmark.triangle.fill";
    tone = C.amber;
    title = "Couldn't get your location";
    text = message || "Location isn't available right now.";
    if (adjustable) text += " Tap the map to drop a pin.";
  }

  return (
    <View>
      <View style={s.card}>
        <View style={[s.icon, { backgroundColor: status === "ok" || status === "loading" ? C.tealTint : C.amberTint }]}>
          {status === "loading" ? <ActivityIndicator size="small" color={C.teal} /> : <IconSymbol name={icon} size={19} color={tone} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.text}>{text}</Text>
        </View>
        <Pressable onPress={() => device.refresh()} disabled={status === "loading"} hitSlop={8} accessibilityLabel="Refresh location" style={s.refresh}>
          <IconSymbol name="arrow.clockwise" size={18} color={C.teal} />
        </Pressable>
      </View>
      {adjustable ? (
        <View style={{ marginTop: 9 }}>
          <LeafletMap
            height={mapHeight}
            pin={coords}
            userLocation={source === "device" ? coords : null}
            onPinChange={device.setCoords}
            viewKey={device.fixCount}
          />
          <Text style={s.hint}>Tap the map or drag the pin to adjust the spot.</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    card: { backgroundColor: C.surface, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "center", gap: 10, ...C.card },
    icon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    title: { color: C.ink, fontSize: 13, fontWeight: "700" },
    text: { color: C.muted, fontSize: 11, marginTop: 3 },
    refresh: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    hint: { color: C.muted, fontSize: 11, marginTop: 6, textAlign: "center" },
  });
