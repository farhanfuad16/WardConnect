import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PressableView } from "@/components/pressable-view";
import { LeafletMap } from "@/components/leaflet-map";
import { useIncidents, useResources } from "@/hooks/useApi";
import { useDeviceLocation } from "@/hooks/use-device-location";
import { type Incident, type Resource } from "@/lib/api";
import { distanceMeters, formatDistance, toCoords, type Coords } from "@/lib/geo";
import { openDirections } from "@/lib/directions";
import type { MapMarker } from "@/lib/leaflet-html";
import { showAlert } from "@/lib/alert";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

function IncidentRow({ item }: { item: Incident }) {
  const { C, s } = useAppStyles(makeStyles);
  return (
    <PressableView onPress={() => router.push(`/incident/${item.id}`)} style={s.row} pressedStyle={{ opacity: .75 }}>
      <View style={[s.dot, { backgroundColor: item.accent || C.coral }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.cat}>{item.category.toUpperCase()} · {item.severity}</Text>
        <Text style={s.rowTitle}>{item.title}</Text>
        <Text style={s.meta}>{item.status}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={C.muted} />
    </PressableView>
  );
}

function ResourceRow({ item, distance }: { item: Resource; distance?: number }) {
  const { C, s } = useAppStyles(makeStyles);
  const coords = toCoords(item.latitude, item.longitude);
  return (
    <View style={s.row}>
      <View style={s.resourceIcon}>
        <IconSymbol name="shield.fill" size={19} color={C.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{item.name}</Text>
        <Text style={s.meta}>{item.category} · {item.address || ""}</Text>
        <Text style={s.contact}>{item.contactInfo}</Text>
        {item.description ? <Text style={s.meta}>{item.description}</Text> : null}
        {distance != null ? <Text style={s.distance}>{formatDistance(distance)} away</Text> : null}
      </View>
      {coords ? (
        <Pressable onPress={() => openDirections(coords)} accessibilityLabel={`Directions to ${item.name}`} hitSlop={8} style={s.directions}>
          <IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={20} color={C.teal} />
        </Pressable>
      ) : (
        <IconSymbol name="chevron.right" size={18} color={C.muted} />
      )}
    </View>
  );
}

export default function MapScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const [mode, setMode] = useState<"incidents" | "resources">("incidents");
  const [search, setSearch] = useState("");

  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents({ limit: 20 });
  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError, refetch: refetchResources } = useResources({ limit: 50 });

  const incidents = incidentsData?.incidents || [];
  const resources = resourcesData?.resources || [];

  const device = useDeviceLocation();
  // Set when the user taps "locate me", to centre the map on them.
  const [locate, setLocate] = useState<{ coords: Coords; n: number } | null>(null);

  const filteredResources = useMemo(() => {
    if (!search) return resources;
    return resources.filter((r) => `${r.name} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
  }, [resources, search]);

  // Nearest first once we know where the user is; rows without coordinates sink to the bottom.
  const resourceRows = useMemo(() => {
    const rows = filteredResources.map((item) => {
      const coords = toCoords(item.latitude, item.longitude);
      return { item, coords, distance: coords && device.coords ? distanceMeters(device.coords, coords) : undefined };
    });
    if (device.coords) rows.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return rows;
  }, [filteredResources, device.coords]);

  const markers = useMemo<MapMarker[]>(() => {
    if (mode === "incidents") {
      return incidents.flatMap((i) => {
        const c = toCoords(i.latitude, i.longitude);
        if (!c) return [];
        const color = i.accent || (i.severity === "High" ? C.coral : i.severity === "Medium" ? C.amber : C.teal);
        return [{ id: i.id, kind: "incident", ...c, color, label: "!", title: i.title, subtitle: `${i.category} · ${i.severity} · ${i.status}`, action: "View details" }];
      });
    }
    return resourceRows.flatMap(({ item, coords }) =>
      coords
        ? [{ id: item.id, kind: "resource", ...coords, color: C.teal, shape: "square" as const, label: item.category.charAt(0).toUpperCase(), title: item.name, subtitle: `${item.category.replace(/_/g, " ")} · ${item.contactInfo}`, action: "Get directions" }]
        : [],
    );
  }, [mode, incidents, resourceRows, C]);

  const onMarkerPress = useCallback(
    ({ kind, id }: { kind: string; id: number }) => {
      if (kind === "incident") return router.push(`/incident/${id}`);
      const r = resources.find((x) => x.id === id);
      const coords = toCoords(r?.latitude, r?.longitude);
      if (coords) openDirections(coords);
    },
    [resources],
  );

  const onLocate = async () => {
    const result = await device.refresh();
    if (result?.status === "ok") return setLocate({ coords: result.coords, n: Date.now() });
    if (!result) return;
    showAlert(
      "Couldn't find your location",
      result.status === "denied"
        ? "Allow location access for WardConnect in your device or browser settings, then try again."
        : result.message,
    );
  };

  const switchMode = (next: "incidents" | "resources") => {
    setMode(next);
    setLocate(null);
  };

  const isLoading = incidentsLoading || resourcesLoading;
  const error = incidentsError || resourcesError;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, paddingTop: 23 }}>
          <Text style={s.eyebrow}>WARD AWARENESS</Text>
          <Text style={s.title}>{mode === "incidents" ? "Incident map" : "Resources"}</Text>
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, paddingTop: 23 }}>
          <Text style={s.eyebrow}>WARD AWARENESS</Text>
          <Text style={s.title}>{mode === "incidents" ? "Incident map" : "Resources"}</Text>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Failed to load data</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error.message}</Text>
            <Pressable onPress={() => { refetchIncidents(); refetchResources(); }} style={{ backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: C.onColor, fontWeight: "600" }}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const data: any[] = mode === "incidents" ? incidents : resourceRows;
  const withoutLocation = data.length - markers.length;

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item: any) => mode === "incidents" ? String(item.id) : String(item.item.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View>
            <Text style={s.eyebrow}>WARD AWARENESS</Text>
            <Text style={s.title}>{mode === "incidents" ? "Incident map" : "Resources"}</Text>
            <Text style={s.subtitle}>{mode === "incidents" ? "Verified public updates for your ward." : "Find local support services and response contacts."}</Text>
            <View style={s.switcher}>
              <Pressable onPress={() => switchMode("incidents")} style={[s.switchItem, mode === "incidents" && s.switchActive]}>
                <Text style={[s.switchText, mode === "incidents" && s.switchTextActive]}>Incidents</Text>
              </Pressable>
              <Pressable onPress={() => switchMode("resources")} style={[s.switchItem, mode === "resources" && s.switchActive]}>
                <Text style={[s.switchText, mode === "resources" && s.switchTextActive]}>Resources</Text>
              </Pressable>
            </View>
            <View>
              <LeafletMap
                height={260}
                markers={markers}
                userLocation={device.coords}
                view={locate ? { latitude: locate.coords.latitude, longitude: locate.coords.longitude, zoom: 15 } : undefined}
                viewKey={`${mode}:${markers.length}:${locate?.n ?? 0}`}
                onMarkerPress={onMarkerPress}
              />
              <Pressable onPress={onLocate} accessibilityLabel="Show my location" style={s.locate}>
                <IconSymbol name="location.fill" size={20} color={C.teal} />
              </Pressable>
            </View>
            {mode === "incidents" ? (
              <>
                <View style={s.legend}>
                  <Text style={s.legendTitle}>Verified incidents only</Text>
                  <Text style={s.legendText}>
                    {markers.length} on the map{withoutLocation > 0 ? ` · ${withoutLocation} without a location yet` : ""}
                  </Text>
                </View>
                <Text style={s.section}>Nearby incidents</Text>
              </>
            ) : (
              <>
                <View style={s.legend}>
                  <Text style={s.legendTitle}>{device.coords ? "Sorted by distance from you" : "Local support services"}</Text>
                  <Text style={s.legendText}>
                    {markers.length} on the map{withoutLocation > 0 ? ` · ${withoutLocation} without a location yet` : ""}
                  </Text>
                </View>
                <View style={s.searchBox}>
                  <IconSymbol name="magnifyingglass" size={18} color={C.muted} />
                  <TextInput value={search} onChangeText={setSearch} placeholder="Search resources" placeholderTextColor={C.muted} style={s.input} />
                </View>
              </>
            )}
          </View>
        }
        renderItem={({ item }: any) => mode === "incidents" ? <IncidentRow item={item} /> : <ResourceRow item={item.item} distance={item.distance} />}
        ListEmptyComponent={<Text style={{ color: C.muted, marginTop: 30, textAlign: "center" }}>{mode === "incidents" ? "No incidents reported." : "No resources found."}</Text>}
      />
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({ content: { paddingTop: 23, paddingBottom: 30 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "700", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, switcher: { flexDirection: "row", backgroundColor: C.switcherBg, borderRadius: 12, padding: 3, marginTop: 18, marginBottom: 15 }, switchItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 }, switchActive: { backgroundColor: C.surface }, switchText: { color: C.muted, fontWeight: "600", fontSize: 13 }, switchTextActive: { color: C.ink }, locate: { position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", zIndex: 5, ...C.shadow, borderWidth: 1, borderColor: C.border }, legend: { backgroundColor: C.surface, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 13, ...C.card }, legendTitle: { color: C.ink, fontSize: 12, fontWeight: "700" }, legendText: { color: C.muted, fontSize: 11, marginTop: 3 }, section: { color: C.ink, fontSize: 17, fontWeight: "700", marginBottom: 10 }, searchBox: { backgroundColor: C.surface, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, marginBottom: 13 }, input: { flex: 1, color: C.ink, fontSize: 14 }, row: { backgroundColor: C.surface, borderRadius: 15, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 11, ...C.card }, dot: { width: 10, height: 10, borderRadius: 5 }, cat: { color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }, rowTitle: { color: C.ink, fontSize: 14, fontWeight: "700", marginTop: 3 }, meta: { color: C.muted, fontSize: 12, marginTop: 2 }, contact: { color: C.teal, fontSize: 12, fontWeight: "600", marginTop: 2 }, distance: { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 3 }, directions: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.tealTint, alignItems: "center", justifyContent: "center" }, resourceIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: C.tealTint, alignItems: "center", justifyContent: "center" } });
