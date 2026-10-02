import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PressableView } from "@/components/pressable-view";
import { useIssues } from "@/hooks/useApi";
import { statusLabel, type Issue } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";
import { timeAgo } from "@/lib/time";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

function IssueCard({ item }: { item: Issue }) {
  const { C, s } = useAppStyles(makeStyles);
  const wasUpdated = item.status !== "submitted";
  const dateStr = wasUpdated ? `Updated ${timeAgo(item.updatedAt)}` : `Reported ${timeAgo(item.createdAt)}`;
  const statusColor = item.status === "in_progress" ? C.amber : C.green;
  const statusBg = item.status === "in_progress" ? C.amberTint : C.greenTint;
  return (
    <PressableView onPress={() => router.push(`/report/${item.id}`)} style={s.card} pressedStyle={{ opacity: 0.75 }}>
      <View style={s.cardTop}>
        <Text style={s.id}>#{item.id}</Text>
        <View style={[s.pill, { backgroundColor: statusBg }]}>
          <Text style={[s.pillText, { color: statusColor }]}>{statusLabel[item.status]}</Text>
        </View>
      </View>
      <Text style={s.category}>{item.category}</Text>
      <Text style={s.itemTitle}>{item.title}</Text>
      <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
      <View style={s.meta}>
        <Text style={s.date}>{dateStr}</Text>
        <IconSymbol name="chevron.right" size={18} color={C.muted} />
      </View>
    </PressableView>
  );
}

export default function ReportsScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const { user } = useAuthContext();
  const { data, isLoading, error, refetch } = useIssues({ wardId: user?.wardId || undefined, limit: 20 });
  const reports = data?.issues || [];
  const wardName = user?.wardName || "your ward";

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, paddingTop: 24 }}>
          <Text style={s.eyebrow}>YOUR ACTIVITY</Text>
          <Text style={s.title}>My reports</Text>
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading reports...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, paddingTop: 24 }}>
          <Text style={s.eyebrow}>YOUR ACTIVITY</Text>
          <Text style={s.title}>My reports</Text>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Failed to load reports</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error.message}</Text>
            <Pressable onPress={() => refetch()} style={{ backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: C.onColor, fontWeight: "600" }}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View>
            <Text style={s.eyebrow}>YOUR ACTIVITY</Text>
            <Text style={s.title}>My reports</Text>
            <Text style={s.subtitle}>Track issues you've raised in {wardName}.</Text>
            <Pressable onPress={() => router.push("/report/new")} style={s.newButton}>
              <IconSymbol name="plus.circle.fill" size={18} color={C.onFill} />
              <Text style={s.newText}>New report</Text>
            </Pressable>
            <Text style={s.section}>Recent submissions</Text>
          </View>
        }
        renderItem={({ item }) => <IssueCard item={item} />}
        ListEmptyComponent={<Text style={s.empty}>No reports yet.</Text>}
      />
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 30 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "700", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, newButton: { backgroundColor: C.tealFill, borderRadius: 14, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 19, marginBottom: 24, ...C.tealGlow }, newText: { color: C.onFill, fontSize: 15, fontWeight: "700" }, section: { color: C.ink, fontSize: 17, fontWeight: "700", marginBottom: 11 }, card: { backgroundColor: C.surface, borderRadius: 17, padding: 15, marginBottom: 10, ...C.card }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, id: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 }, pill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }, pillText: { fontSize: 11, fontWeight: "700" }, category: { color: C.muted, fontSize: 11, fontWeight: "700", marginTop: 12, letterSpacing: 0.5 }, itemTitle: { color: C.ink, fontSize: 16, fontWeight: "700", marginTop: 4 }, desc: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }, meta: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 13, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, date: { color: C.muted, fontSize: 11 }, empty: { color: C.muted, marginTop: 30, textAlign: "center" } });
