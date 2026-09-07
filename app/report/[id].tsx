import { ActivityIndicator, Image, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useIssue } from "@/hooks/useApi";
import { statusLabel } from "@/lib/api";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", green: "#2F855A", amber: "#D97706", coral: "#D9485F" };

const statusTimeline: Record<string, { label: string; time: string; done: boolean }[]> = {
  submitted: [
    { label: "Reported", time: "Just now", done: true },
    { label: "Acknowledged", time: "", done: false },
    { label: "In progress", time: "", done: false },
    { label: "Resolved", time: "", done: false },
  ],
  acknowledged: [
    { label: "Reported", time: "", done: true },
    { label: "Acknowledged", time: "", done: true },
    { label: "In progress", time: "", done: false },
    { label: "Resolved", time: "", done: false },
  ],
  in_progress: [
    { label: "Reported", time: "", done: true },
    { label: "Acknowledged", time: "", done: true },
    { label: "In progress", time: "", done: true },
    { label: "Resolved", time: "", done: false },
  ],
  resolved: [
    { label: "Reported", time: "", done: true },
    { label: "Acknowledged", time: "", done: true },
    { label: "In progress", time: "", done: true },
    { label: "Resolved", time: "", done: true },
  ],
  rejected: [
    { label: "Reported", time: "", done: true },
    { label: "Rejected", time: "", done: true },
  ],
};

export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const issueId = parseInt(id || "0", 10);
  const { data, isLoading, error } = useIssue(issueId);
  const item = data?.issue;

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <ScrollView contentContainerStyle={s.content}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <IconSymbol name="arrow.left" size={21} color={C.ink} />
            <Text style={s.backText}>My reports</Text>
          </Pressable>
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading report...</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (error || !item) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <ScrollView contentContainerStyle={s.content}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <IconSymbol name="arrow.left" size={21} color={C.ink} />
            <Text style={s.backText}>My reports</Text>
          </Pressable>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Report not found</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>{error?.message || "This report could not be loaded."}</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const dateStr = new Date(item.createdAt).toLocaleDateString();
  const timeline = statusTimeline[item.status] || statusTimeline.submitted;
  const pillColor = item.status === "in_progress" ? "#FFF1D9" : "#E2F2EA";
  const pillTextColor = item.status === "in_progress" ? C.amber : C.green;

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <IconSymbol name="arrow.left" size={21} color={C.ink} />
          <Text style={s.backText}>My reports</Text>
        </Pressable>
        <Text style={s.eyebrow}>#{item.id}</Text>
        <Text style={s.title}>{item.category}</Text>
        <View style={[s.pill, { backgroundColor: pillColor }]}>
          <Text style={[s.pillText, { color: pillTextColor }]}>{statusLabel[item.status]}</Text>
        </View>
        
        {item.photoUrl ? (
          <>
            <Text style={s.section}>Photo</Text>
            <View style={s.imageContainer}>
              <Image source={{ uri: item.photoUrl }} style={s.image} resizeMode="cover" />
            </View>
          </>
        ) : null}
        
        <Text style={s.section}>Report details</Text>
        <View style={s.card}>
          <Text style={s.body}>{item.description}</Text>
          <View style={s.divider} />
          <Text style={s.metaLabel}>Location</Text>
          <Text style={s.value}>{item.landmark || item.wardName || "Ward"}</Text>
          {item.latitude && item.longitude && <Text style={s.coords}>{item.latitude}, {item.longitude}</Text>}
          <Text style={s.metaLabel}>Submitted</Text>
          <Text style={s.value}>{dateStr}</Text>
        </View>
        <Text style={s.section}>Timeline</Text>
        <View style={s.card}>
          {timeline.map((event, i) => (
            <View key={event.label} style={s.timeline}>
              <View style={[s.dot, !event.done && { backgroundColor: C.border }]} />
              <View>
                <Text style={[s.event, !event.done && { color: C.muted }]}>{event.label}</Text>
                {event.time ? <Text style={s.time}>{event.time}</Text> : null}
              </View>
              {i < timeline.length - 1 && <View style={s.line} />}
            </View>
          ))}
        </View>
        <Text style={s.note}>Updates from the ward team will appear here as the report progresses.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({ content: { paddingTop: 17, paddingBottom: 32 }, back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 25 }, backText: { color: C.ink, fontWeight: "700" }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, title: { color: C.ink, fontSize: 29, fontWeight: "800", marginTop: 7 }, pill: { alignSelf: "flex-start", marginTop: 11, backgroundColor: "#E2F2EA", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, pillText: { color: C.green, fontSize: 11, fontWeight: "800" }, section: { color: C.ink, fontSize: 17, fontWeight: "800", marginTop: 25, marginBottom: 10 }, card: { backgroundColor: C.surface, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: C.border }, body: { color: C.muted, fontSize: 14, lineHeight: 21 }, divider: { height: 1, backgroundColor: C.border, marginVertical: 14 }, metaLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginTop: 10 }, value: { color: C.ink, fontSize: 13, fontWeight: "700", marginTop: 3 }, coords: { color: C.teal, fontSize: 11, marginTop: 3 }, imageContainer: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border }, image: { width: "100%", height: 200 }, timeline: { flexDirection: "row", gap: 11, minHeight: 55, position: "relative" }, dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.teal, marginTop: 3 }, line: { position: "absolute", left: 5, top: 16, width: 2, height: 42, backgroundColor: "#B9DED5" }, event: { color: C.ink, fontSize: 13, fontWeight: "800" }, time: { color: C.muted, fontSize: 11, marginTop: 3 }, note: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 15 } });
