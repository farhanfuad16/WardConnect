import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useIncidents, useResources } from "@/hooks/useApi";
import { type Incident, type Resource } from "@/lib/api";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", coral: "#D9485F", amber: "#D97706" };

function IncidentRow({ item }: { item: Incident }) {
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
  return (
    <View style={s.row}>
      <View style={s.resourceIcon}>
        <IconSymbol name="shield.fill" size={19} color={C.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{item.name}</Text>
        <Text style={s.meta}>{item.category} · {item.address || ""}</Text>
        <Text style={s.contact}>{item.contactInfo}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={C.muted} />
    </View>
  );
}

function Marker({ left, top, color, value }: { left: any; top: any; color: string; value: string }) {
  return <View style={[s.marker, { left, top, backgroundColor: color }]}><Text style={s.markerText}>{value}</Text></View>;
}

export default function MapScreen() {
  const [mode, setMode] = useState<"incidents" | "resources">("incidents");
  const [search, setSearch] = useState("");

  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents({ limit: 20 });
  const { data: resourcesData, isLoading: resourcesLoading, error: resourcesError, refetch: refetchResources } = useResources({ limit: 50 });

  const incidents = incidentsData?.incidents || [];
  const resources = resourcesData?.resources || [];

  const filteredResources = useMemo(() => {
    if (!search) return resources;
    return resources.filter((r) => `${r.name} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
  }, [resources, search]);

  const isLoading = incidentsLoading || resourcesLoading;
  const error = incidentsError || resourcesError;

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
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
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 23 }}>
          <Text style={s.eyebrow}>WARD AWARENESS</Text>
          <Text style={s.title}>{mode === "incidents" ? "Incident map" : "Resources"}</Text>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Failed to load data</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error.message}</Text>
            <Pressable onPress={() => { refetchIncidents(); refetchResources(); }} style={{ backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: C.surface, fontWeight: "700" }}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const data: any[] = mode === "incidents" ? incidents : filteredResources;

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
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
                <View style={s.map}>
                  <View style={s.roadA} />
                  <View style={s.roadB} />
                  <Marker left="25%" top="35%" color={C.coral} value="1" />
                  <Marker left="62%" top="52%" color={C.amber} value="2" />
                  <Marker left="48%" top="23%" color={C.teal} value="3" />
                  <View style={s.mapLabel}>
                    <IconSymbol name="location.fill" size={13} color={C.teal} />
                    <Text style={s.mapLabelText}>Ward · Your area</Text>
                  </View>
                </View>
                <View style={s.legend}>
                  <Text style={s.legendTitle}>Verified incidents only</Text>
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

const s = StyleSheet.create({ content: { paddingTop: 23, paddingBottom: 30 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "800", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, switcher: { flexDirection: "row", backgroundColor: "#E6F0EE", borderRadius: 12, padding: 3, marginTop: 18, marginBottom: 15 }, switchItem: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 }, switchActive: { backgroundColor: C.surface }, switchText: { color: C.muted, fontWeight: "700", fontSize: 13 }, switchTextActive: { color: C.ink }, map: { height: 210, borderRadius: 19, overflow: "hidden", backgroundColor: "#DDEAE4", position: "relative", borderWidth: 1, borderColor: C.border }, roadA: { position: "absolute", width: 360, height: 16, backgroundColor: "#F7FBF9", transform: [{ rotate: "27deg" }], top: 77, left: -30 }, roadB: { position: "absolute", width: 310, height: 12, backgroundColor: "#F7FBF9", transform: [{ rotate: "-37deg" }], top: 105, left: 40 }, marker: { position: "absolute", width: 29, height: 29, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.surface }, markerText: { color: C.surface, fontWeight: "900", fontSize: 12 }, mapLabel: { position: "absolute", bottom: 12, left: 12, backgroundColor: C.surface, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", gap: 5, alignItems: "center" }, mapLabelText: { color: C.ink, fontSize: 11, fontWeight: "800" }, legend: { backgroundColor: C.surface, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 13 }, legendTitle: { color: C.ink, fontSize: 12, fontWeight: "800" }, legendText: { color: C.muted, fontSize: 11, marginTop: 3 }, section: { color: C.ink, fontSize: 17, fontWeight: "800", marginBottom: 10 }, searchBox: { backgroundColor: C.surface, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, marginBottom: 13 }, input: { flex: 1, color: C.ink, fontSize: 14 }, row: { backgroundColor: C.surface, borderRadius: 15, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: C.border }, dot: { width: 10, height: 10, borderRadius: 5 }, cat: { color: C.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }, rowTitle: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 3 }, meta: { color: C.muted, fontSize: 12, marginTop: 2 }, contact: { color: C.teal, fontSize: 12, fontWeight: "700", marginTop: 2 }, resourceIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#E3F1EC", alignItems: "center", justifyContent: "center" } });
