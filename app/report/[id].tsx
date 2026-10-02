import { ActivityIndicator, Image, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LeafletMap } from "@/components/leaflet-map";
import { toCoords } from "@/lib/geo";
import { useIssue } from "@/hooks/useApi";
import { statusLabel } from "@/lib/api";
import { timeAgoWithDate } from "@/lib/time";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

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
  const { C, s } = useAppStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const issueId = parseInt(id || "0", 10);
  const { data, isLoading, error } = useIssue(issueId);
  const item = data?.issue;

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={s.content}>
          <BackButton label="My reports" />
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
      <ScreenContainer>
        <ScrollView contentContainerStyle={s.content}>
          <BackButton label="My reports" />
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Report not found</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center" }}>{error?.message || "This report could not be loaded."}</Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const coords = toCoords(item.latitude, item.longitude);
  const submittedStr = timeAgoWithDate(item.createdAt);
  const wasUpdated = item.status !== "submitted";
  const updatedStr = timeAgoWithDate(item.updatedAt);

  const baseTimeline = statusTimeline[item.status] || statusTimeline.submitted;
  const lastDoneIndex = baseTimeline.reduce((last, e, i) => (e.done ? i : last), 0);
  const timeline = baseTimeline.map((event, i) => {
    if (i === 0) return { ...event, time: submittedStr };
    if (i === lastDoneIndex && wasUpdated) return { ...event, time: updatedStr };
    return event;
  });
  const pillColor = item.status === "in_progress" ? C.amberTint : C.greenTint;
  const pillTextColor = item.status === "in_progress" ? C.amber : C.green;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.content}>
        <BackButton label="My reports" />
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
          {coords ? <Text style={s.coords}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text> : null}
          <Text style={s.metaLabel}>Submitted</Text>
          <Text style={s.value}>{submittedStr}</Text>
          {wasUpdated && (
            <>
              <Text style={s.metaLabel}>Last updated</Text>
              <Text style={s.value}>{updatedStr}</Text>
            </>
          )}
        </View>
        {coords ? (
          <>
            <Text style={s.section}>Reported location</Text>
            <LeafletMap height={180} pin={coords} view={{ ...coords, zoom: 16 }} />
          </>
        ) : null}
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

const makeStyles = (C: AppColors) => StyleSheet.create({ content: { paddingTop: 17, paddingBottom: 32 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1 }, title: { color: C.ink, fontSize: 29, fontWeight: "700", marginTop: 7 }, pill: { alignSelf: "flex-start", marginTop: 11, backgroundColor: C.greenTint, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, pillText: { color: C.green, fontSize: 11, fontWeight: "700" }, section: { color: C.ink, fontSize: 17, fontWeight: "700", marginTop: 25, marginBottom: 10 }, card: { backgroundColor: C.surface, borderRadius: 16, padding: 15, ...C.card }, body: { color: C.muted, fontSize: 14, lineHeight: 21 }, divider: { height: 1, backgroundColor: C.border, marginVertical: 14 }, metaLabel: { color: C.muted, fontSize: 10, fontWeight: "700", marginTop: 10 }, value: { color: C.ink, fontSize: 13, fontWeight: "600", marginTop: 3 }, coords: { color: C.teal, fontSize: 11, marginTop: 3 }, imageContainer: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", ...C.card }, image: { width: "100%", height: 200 }, timeline: { flexDirection: "row", gap: 11, minHeight: 55, position: "relative" }, dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.teal, marginTop: 3 }, line: { position: "absolute", left: 5, top: 16, width: 2, height: 42, backgroundColor: C.timelineLine }, event: { color: C.ink, fontSize: 13, fontWeight: "700" }, time: { color: C.muted, fontSize: 11, marginTop: 3 }, note: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 15 } });
