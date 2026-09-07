import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/context/AuthContext";
import { useNotices, useIncidents } from "@/hooks/useApi";

const colors = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", coral: "#D9485F", amber: "#D97706", border: "#DCE9E6" };

function ActionCard({ title, subtitle, icon, color, onPress }: { title: string; subtitle: string; icon: "plus.circle.fill" | "exclamationmark.triangle.fill"; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: color }, pressed && styles.pressed]}><View style={styles.actionIcon}><IconSymbol name={icon} size={28} color={colors.surface} /></View><View style={{ flex: 1 }}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{subtitle}</Text></View><IconSymbol name="chevron.right" size={24} color={colors.surface} /></Pressable>;
}

function LoadingState() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
      <ActivityIndicator size="large" color={colors.teal} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>Loading...</Text>
    </View>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 }}>
      <Text style={{ color: colors.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{message}</Text>
      <Pressable onPress={retry} style={{ backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
        <Text style={{ color: colors.surface, fontWeight: "700" }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { data: noticesData, isLoading: noticesLoading, error: noticesError, refetch: refetchNotices } = useNotices({ limit: 3 });
  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents({ limit: 1 });

  const isLoading = noticesLoading || incidentsLoading;
  const hasError = noticesError || incidentsError;

  if (isLoading) {
    return <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><LoadingState /></ScrollView></ScreenContainer>;
  }

  if (hasError) {
    return <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><ErrorState message={noticesError?.message || incidentsError?.message || "Failed to load data"} retry={() => { refetchNotices(); refetchIncidents(); }} /></ScrollView></ScreenContainer>;
  }

  const notices = noticesData?.notices || [];
  const incidents = incidentsData?.incidents || [];
  const firstName = user?.name?.split(" ")[0] || "User";
  const wardDisplay = user?.wardName ? `Ward ${user.wardId} · ${user.wardName}` : "No ward assigned";

  return <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>GOOD MORNING</Text><Text style={styles.title}>Welcome, {firstName}</Text><View style={styles.wardRow}><IconSymbol name="location.fill" size={15} color={colors.teal} /><Text style={styles.ward}>{wardDisplay}</Text></View></View><Pressable onPress={() => router.push("/notifications")} style={styles.bell}><IconSymbol name="bell.fill" size={22} color={colors.ink} /></Pressable></View>
    <View style={styles.safety}><View style={styles.safetyDot} /><View style={{ flex: 1 }}><Text style={styles.safetyTitle}>Your ward is being monitored</Text><Text style={styles.safetyText}>Stay informed with verified local updates.</Text></View></View>
    <Text style={styles.section}>Quick actions</Text>
    <ActionCard title="Report an issue" subtitle="Help improve your neighborhood" icon="plus.circle.fill" color={colors.teal} onPress={() => router.push("/report/new")} />
    <ActionCard title="Send an SOS" subtitle="For urgent ward assistance" icon="exclamationmark.triangle.fill" color={colors.coral} onPress={() => router.push("/sos")} />
    {incidents.length > 0 && <>
      <View style={styles.sectionRow}><Text style={styles.section}>Active emergency</Text><Pressable onPress={() => router.push(`/incident/${incidents[0].id}`)}><Text style={styles.link}>View map</Text></Pressable></View>
      <Pressable onPress={() => router.push(`/incident/${incidents[0].id}`)} style={styles.emergency}><View style={styles.emergencyIcon}><IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.coral} /></View><View style={{ flex: 1 }}><Text style={styles.emergencyLabel}>VERIFIED INCIDENT · {incidents[0].severity?.toUpperCase()}</Text><Text style={styles.emergencyTitle}>{incidents[0].title}</Text><Text style={styles.emergencyMeta}>{incidents[0].status} · {incidents[0].category}</Text></View><IconSymbol name="chevron.right" size={21} color={colors.muted} /></Pressable>
    </>}
    <View style={styles.sectionRow}><Text style={styles.section}>Latest notices</Text><Pressable onPress={() => router.push("/(tabs)/notices")}><Text style={styles.link}>See all</Text></Pressable></View>
    {notices.length === 0 ? (
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>No notices yet.</Text>
    ) : (
      notices.map((notice) => <Pressable key={notice.id} onPress={() => router.push("/(tabs)/notices")} style={styles.notice}><View style={[styles.noticeBar, { backgroundColor: notice.category === "Emergency Alert" ? colors.coral : notice.category === "Utility Notice" ? colors.amber : colors.teal }]} /><View style={{ flex: 1 }}><Text style={styles.noticeCategory}>{notice.category.toUpperCase()}</Text><Text style={styles.noticeTitle}>{notice.title}</Text><Text style={styles.noticeDate}>{new Date(notice.createdAt).toLocaleDateString()}</Text></View><IconSymbol name="chevron.right" size={19} color={colors.muted} /></Pressable>)
    )}
    <Text style={styles.footer}>For life-threatening emergencies, call <Text style={{ color: colors.coral, fontWeight: "800" }}>999</Text>.</Text>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 22, paddingBottom: 28 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }, eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 }, title: { color: colors.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.5 }, wardRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }, ward: { color: colors.teal, fontSize: 14, fontWeight: "700" }, bell: { height: 46, width: 46, borderRadius: 23, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border }, badge: { position: "absolute", top: -2, right: -1, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.bg }, badgeText: { color: colors.surface, fontSize: 9, fontWeight: "800" }, safety: { backgroundColor: "#E2F2EA", borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 24 }, safetyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2F855A" }, safetyTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" }, safetyText: { color: "#48705E", fontSize: 12, marginTop: 3 }, section: { color: colors.ink, fontSize: 17, fontWeight: "800", marginBottom: 11 }, actionCard: { borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 11 }, actionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF26", alignItems: "center", justifyContent: "center" }, actionTitle: { color: colors.surface, fontSize: 16, fontWeight: "800" }, actionSub: { color: "#FFFFFFD9", fontSize: 12, marginTop: 3 }, pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 17 }, link: { color: colors.teal, fontSize: 13, fontWeight: "800" }, emergency: { backgroundColor: colors.surface, borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border }, emergencyIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FCE8EC", alignItems: "center", justifyContent: "center" }, emergencyLabel: { color: colors.coral, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 }, emergencyTitle: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 4 }, emergencyMeta: { color: colors.muted, fontSize: 12, marginTop: 3 }, notice: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border }, noticeBar: { width: 4, height: 40, borderRadius: 2 }, noticeCategory: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, noticeTitle: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 3 }, noticeDate: { color: colors.muted, fontSize: 10, marginTop: 4 }, footer: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 24 } });
