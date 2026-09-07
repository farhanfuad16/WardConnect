import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useIssues } from "@/hooks/useApi";
import { statusLabel, type Issue } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", green: "#2F855A", amber: "#D97706", coral: "#D9485F" };

function IssueCard({ item }: { item: Issue }) {
  const dateStr = new Date(item.createdAt).toLocaleDateString();
  const statusColor = item.status === "in_progress" ? C.amber : C.green;
  const statusBg = item.status === "in_progress" ? "#FFF1D9" : "#E2F2EA";
  return (
    <Pressable onPress={() => router.push(`/report/${item.id}`)} style={({ pressed }) => [s.card, pressed && { opacity: 0.75 }]}>
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
    </Pressable>
  );
}

export default function ReportsScreen() {
  const { user } = useAuthContext();
  const { data, isLoading, error, refetch } = useIssues({ wardId: user?.wardId || undefined, limit: 20 });
  const reports = data?.issues || [];
  const wardName = user?.wardName || "your ward";

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
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
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 24 }}>
          <Text style={s.eyebrow}>YOUR ACTIVITY</Text>
          <Text style={s.title}>My reports</Text>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Failed to load reports</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error.message}</Text>
            <Pressable onPress={() => refetch()} style={{ backgroundColor: C.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: C.surface, fontWeight: "700" }}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
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
              <IconSymbol name="plus.circle.fill" size={19} color={C.surface} />
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

const s = StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 30 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "800", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, newButton: { backgroundColor: C.teal, borderRadius: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 19, marginBottom: 24 }, newText: { color: C.surface, fontSize: 15, fontWeight: "800" }, section: { color: C.ink, fontSize: 17, fontWeight: "800", marginBottom: 11 }, card: { backgroundColor: C.surface, borderRadius: 17, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: C.border }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, id: { color: C.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 }, pill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 }, pillText: { fontSize: 11, fontWeight: "800" }, category: { color: C.muted, fontSize: 11, fontWeight: "800", marginTop: 12, letterSpacing: 0.5 }, itemTitle: { color: C.ink, fontSize: 16, fontWeight: "800", marginTop: 4 }, desc: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }, meta: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 13, paddingTop: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, date: { color: C.muted, fontSize: 11 }, empty: { color: C.muted, marginTop: 30, textAlign: "center" } });
