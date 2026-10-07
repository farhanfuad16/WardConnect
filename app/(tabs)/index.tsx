import { ActivityIndicator, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { router, type Href } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PressableView } from "@/components/pressable-view";
import { useAuthContext } from "@/context/AuthContext";
import { useNotices, useIncidents } from "@/hooks/useApi";
import { NotificationBell } from "@/components/notification-bell";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((p) => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function ActionTile({ title, subtitle, icon, color, glow, onPress }: { title: string; subtitle: string; icon: "plus.circle.fill" | "exclamationmark.triangle.fill"; color: string; glow: object; onPress: () => void }) {
  const { C: colors, s: styles } = useAppStyles(makeStyles);
  return (
    <PressableView onPress={onPress} style={[styles.tile, { backgroundColor: color }, glow]} pressedStyle={styles.pressed}>
      <View style={styles.tileIcon}>
        <IconSymbol name={icon} size={20} color={colors.onFill} />
      </View>
      <View>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSub}>{subtitle}</Text>
      </View>
    </PressableView>
  );
}

function LoadingState() {
  const { C: colors } = useAppStyles(makeStyles);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
      <ActivityIndicator size="large" color={colors.teal} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>Loading...</Text>
    </View>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  const { C: colors } = useAppStyles(makeStyles);
  return (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 }}>
      <Text style={{ color: colors.coral, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Something went wrong</Text>
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{message}</Text>
      <Pressable onPress={retry} style={{ backgroundColor: colors.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
        <Text style={{ color: colors.onColor, fontWeight: "600" }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { C: colors, s: styles } = useAppStyles(makeStyles);
  const { user } = useAuthContext();
  const { data: noticesData, isLoading: noticesLoading, error: noticesError, refetch: refetchNotices } = useNotices({ limit: 3 });
  const { data: incidentsData, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents({ status: "Active,Monitoring", limit: 20 });

  const isLoading = noticesLoading || incidentsLoading;
  const hasError = noticesError || incidentsError;

  if (isLoading) {
    return <ScreenContainer><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><LoadingState /></ScrollView></ScreenContainer>;
  }

  if (hasError) {
    return <ScreenContainer><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><ErrorState message={noticesError?.message || incidentsError?.message || "Failed to load data"} retry={() => { refetchNotices(); refetchIncidents(); }} /></ScrollView></ScreenContainer>;
  }

  const notices = noticesData?.notices || [];
  const incidents = (incidentsData?.incidents || []).filter((incident) => {
    const status = incident.status.trim().toLowerCase();
    return status === "active" || status === "monitoring";
  });
  const fullName = user?.name || "User";
  const firstName = fullName.split(" ")[0];
  const wardDisplay = user?.wardName ? (/^ward\s/i.test(user.wardName) ? user.wardName : `Ward ${user.wardId} · ${user.wardName}`) : "No ward assigned";

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(fullName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting(new Date().getHours())}</Text>
            <Text style={styles.title} numberOfLines={1}>{firstName}</Text>
          </View>
          <NotificationBell />
        </View>

        <View style={styles.wardChip}>
          <IconSymbol name="location.fill" size={15} color={colors.teal} />
          <Text style={styles.ward}>{wardDisplay}</Text>
        </View>

        <View style={styles.safety}>
          <View style={styles.safetyDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Your ward is being monitored</Text>
            <Text style={styles.safetyText}>Stay informed with verified local updates.</Text>
          </View>
        </View>

        <Text style={styles.section}>Quick actions</Text>
        <View style={styles.tiles}>
          <ActionTile title="Report an issue" subtitle="Help improve your area" icon="plus.circle.fill" color={colors.tealFill} glow={colors.tealGlow} onPress={() => router.push("/report/new")} />
          <ActionTile title="Send an SOS" subtitle="Urgent ward assistance" icon="exclamationmark.triangle.fill" color={colors.coralFill} glow={colors.coralGlow} onPress={() => router.push("/sos")} />
        </View>

        {incidents.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>Active emergencies</Text>
            </View>
            {incidents.map((incident) => (
              <Pressable key={incident.id} onPress={() => router.push(`/incident/${incident.id}`)} style={styles.emergency}>
                <View style={styles.emergencyIcon}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyLabel}>VERIFIED INCIDENT · {incident.severity?.toUpperCase()}</Text>
                  <Text style={styles.emergencyTitle}>{incident.title}</Text>
                  <Text style={styles.emergencyMeta}>{incident.status} · {incident.category}</Text>
                </View>
                <IconSymbol name="chevron.right" size={21} color={colors.muted} />
              </Pressable>
            ))}
          </>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Latest notices</Text>
          <Pressable onPress={() => router.push("/(tabs)/notices")}><Text style={styles.link}>See all</Text></Pressable>
        </View>
        {notices.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>No notices yet.</Text>
        ) : (
          notices.map((notice) => (
            <Pressable key={notice.id} onPress={() => router.push(`/notices/${notice.id}` as Href)} style={styles.notice}>
              <View style={[styles.noticeBar, { backgroundColor: notice.category === "Emergency Alert" ? colors.coral : notice.category === "Utility Notice" ? colors.amber : colors.teal }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeCategory}>{notice.category.toUpperCase()}</Text>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeDate}>{new Date(notice.createdAt).toLocaleDateString()}</Text>
              </View>
              <IconSymbol name="chevron.right" size={19} color={colors.muted} />
            </Pressable>
          ))
        )}
        <Text style={styles.footer}>For life-threatening emergencies, call <Text style={{ color: colors.coral, fontWeight: "700" }}>999</Text>.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 28 },
  header: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.tealTintStrong, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.teal, fontSize: 17, fontWeight: "700" },
  greeting: { color: colors.muted, fontSize: 13, fontWeight: "500" },
  title: { color: colors.ink, fontSize: 24, fontWeight: "700", letterSpacing: -0.4, marginTop: 1 },
  wardChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.tealTint, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, marginTop: 18 },
  ward: { color: colors.teal, fontSize: 13, fontWeight: "600" },
  safety: { backgroundColor: colors.greenTint, borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", gap: 11, marginTop: 14, marginBottom: 26 },
  safetyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  safetyTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  safetyText: { color: colors.safetyText, fontSize: 12, marginTop: 3 },
  section: { color: colors.ink, fontSize: 18, fontWeight: "700", marginBottom: 12 },
  tiles: { flexDirection: "row", gap: 12, marginBottom: 8 },
  tile: { flex: 1, minHeight: 106, borderRadius: 20, padding: 14, gap: 8, justifyContent: "space-between" },
  tileIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.onFill + "26", alignItems: "center", justifyContent: "center" },
  tileTitle: { color: colors.onFill, fontSize: 16, fontWeight: "700" },
  tileSub: { color: colors.onFill, opacity: 0.85, fontSize: 12, marginTop: 3 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  link: { color: colors.teal, fontSize: 13, fontWeight: "600", marginBottom: 12 },
  emergency: { backgroundColor: colors.surface, borderRadius: 18, padding: 15, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, ...colors.card, borderLeftWidth: 4, borderLeftColor: colors.coral },
  emergencyIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center" },
  emergencyLabel: { color: colors.coral, fontSize: 10, fontWeight: "600", letterSpacing: 0.6 },
  emergencyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700", marginTop: 4 },
  emergencyMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  notice: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, ...colors.card },
  noticeBar: { width: 4, height: 40, borderRadius: 2 },
  noticeCategory: { color: colors.muted, fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  noticeTitle: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: 3 },
  noticeDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
  footer: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 24 },
});
