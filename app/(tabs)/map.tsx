import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import WardMap, { type WardMapMarker } from "@/components/ward-map";
import { useIncidents, useResources } from "@/hooks/useApi";
import { useUserLocation } from "@/hooks/use-user-location";
import { type Incident, type Resource } from "@/lib/api";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

function IncidentRow({ item }: { item: Incident }) {
  const { C, s } = useAppStyles(makeStyles);
  return (
    <Pressable onPress={() => router.push(`/incident/${item.id}`)} style={({ pressed }) => [s.row, pressed && { opacity: .75 }]}>
      <View style={[s.dot, { backgroundColor: item.accent || C.coral }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.cat}>{item.category.toUpperCase()} · {item.severity}</Text>
        <Text style={s.rowTitle}>{item.title}</Text>
        <Text style={s.meta}>{item.status}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={C.muted} />
    </Pressable>
  );
}

function ResourceRow({ item }: { item: Resource }) {
  const { C, s } = useAppStyles(makeStyles);
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
      </View>
      <IconSymbol name="chevron.right" size={18} color={C.muted} />
    </View>
  );
}

function locationLabel(location: ReturnType<typeof useUserLocation>): string {
  if (location.status === "requesting") return "Locating you…";
  if (location.status === "denied") return location.error ?? "Location permission denied";
  if (location.status === "unavailable") return location.error ?? "Location unavailable";
  if (location.coords) {
    const accuracy = location.accuracy ? ` · ±${Math.round(location.accuracy)}m` : "";
    return `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}${accuracy}`;
  }
  return "Your location";
}

export default function MapScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const [mode, setMode] = useState<"incidents" | "resources">("incidents");
  const [search, setSearch] = useState("");

  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents({ limit: 20 });
  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError, refetch: refetchResources } = useResources({ limit: 50 });
  const location = useUserLocation();

  const incidents = incidentsData?.incidents || [];
  const resources = resourcesData?.resources || [];

  const mapMarkers = useMemo<WardMapMarker[]>(
    () =>
      incidents.flatMap((incident) => {
        const latitude = Number(incident.latitude);
        const longitude = Number(incident.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        return [
          {
            id: incident.id,
            latitude,
            longitude,
            color: incident.accent || C.coral,
            title: incident.title,
            description: `${incident.category} · ${incident.severity}`,
          },
        ];
      }),
    [incidents, C.coral]
  );

  const filteredResources = useMemo(() => {
    if (!search) return resources;
    return resources.filter((r) => `${r.name} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
  }, [resources, search]);

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

  const data: any[] = mode === "incidents" ? incidents : filteredResources;

  return (
    <ScreenContainer>
      <FlatList
        data={data}
        keyExtractor={(item: any) => mode === "incidents" ? String(item.id) : String(item.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View>
            <Text style={s.eyebrow}>WARD AWARENESS</Text>
            <Text style={s.title}>{mode === "incidents" ? "Incident map" : "Resources"}</Text>
            <Text style={s.subtitle}>{mode === "incidents" ? "Verified public updates for your ward." : "Find local support services and response contacts."}</Text>
            <View style={s.switcher}>
              <Pressable onPress={() => setMode("incidents")} style={[s.switchItem, mode === "incidents" && s.switchActive]}>
                <Text style={[s.switchText, mode === "incidents" && s.switchTextActive]}>Incidents</Text>
              </Pressable>
              <Pressable onPress={() => setMode("resources")} style={[s.switchItem, mode === "resources" && s.switchActive]}>
                <Text style={[s.switchText, mode === "resources" && s.switchTextActive]}>Resources</Text>
              </Pressable>
            </View>
            {mode === "incidents" ? (
              <>
                <WardMap
                  userLocation={location.coords}
                  accuracyMeters={location.accuracy}
                  markers={mapMarkers}
                  loading={location.status === "requesting"}
                  onMarkerPress={(id) => router.push(`/incident/${id}`)}
                />
                <View style={s.legend}>
                  <View style={s.locationRow}>
                    <IconSymbol
                      name="location.fill"
                      size={14}
                      color={location.status === "granted" ? C.teal : C.amber}
                    />
                    <Text style={s.locationText}>{locationLabel(location)}</Text>
                    {location.status !== "granted" ? (
                      <Pressable onPress={location.refresh} hitSlop={8}>
                        <Text style={s.retry}>Retry</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={s.legendTitle}>
                    {mapMarkers.length > 0
                      ? `${mapMarkers.length} located incident${mapMarkers.length === 1 ? "" : "s"} · ${incidents.length - mapMarkers.length} without coordinates`
                      : "Verified incidents only"}
                  </Text>
                  <Text style={s.legendText}>Emergency · Utility · Road works</Text>
                </View>
                <Text style={s.section}>Nearby incidents</Text>
              </>
            ) : (
              <View style={s.searchBox}>
                <IconSymbol name="magnifyingglass" size={18} color={C.muted} />
                <TextInput value={search} onChangeText={setSearch} placeholder="Search resources" placeholderTextColor={C.muted} style={s.input} />
              </View>
            )}
          </View>
        }
        renderItem={({ item }: any) => mode === "incidents" ? <IncidentRow item={item} /> : <ResourceRow item={item} />}
        ListEmptyComponent={<Text style={{ color: C.muted, marginTop: 30, textAlign: "center" }}>{mode === "incidents" ? "No incidents reported." : "No resources found."}</Text>}
      />
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({ content: { paddingTop: 23, paddingBottom: 30 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "700", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, switcher: { flexDirection: "row", backgroundColor: C.switcherBg, borderRadius: 12, padding: 3, marginTop: 18, marginBottom: 15 }, switchItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 }, switchActive: { backgroundColor: C.surface }, switchText: { color: C.muted, fontWeight: "600", fontSize: 13 }, switchTextActive: { color: C.ink }, locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }, locationText: { color: C.ink, fontSize: 11, fontWeight: "600", flexShrink: 1 }, retry: { color: C.teal, fontSize: 11, fontWeight: "700" }, legend: { backgroundColor: C.surface, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 13, ...C.card }, legendTitle: { color: C.ink, fontSize: 12, fontWeight: "700" }, legendText: { color: C.muted, fontSize: 11, marginTop: 3, flexShrink: 1 }, section: { color: C.ink, fontSize: 17, fontWeight: "700", marginBottom: 10 }, searchBox: { backgroundColor: C.surface, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, marginBottom: 13 }, input: { flex: 1, color: C.ink, fontSize: 14 }, row: { backgroundColor: C.surface, borderRadius: 15, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 11, ...C.card }, dot: { width: 10, height: 10, borderRadius: 5 }, cat: { color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }, rowTitle: { color: C.ink, fontSize: 14, fontWeight: "700", marginTop: 3 }, meta: { color: C.muted, fontSize: 12, marginTop: 2 }, contact: { color: C.teal, fontSize: 12, fontWeight: "600", marginTop: 2 }, resourceIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: C.tealTint, alignItems: "center", justifyContent: "center" } });
