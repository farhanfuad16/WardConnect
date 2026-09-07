import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNotices } from "@/hooks/useApi";
import { type Notice } from "@/lib/api";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", coral: "#D9485F", amber: "#D97706" };

function NoticeCard({ item }: { item: Notice }) {
  const dateStr = new Date(item.createdAt).toLocaleDateString();
  const color = item.category === "Emergency Alert" ? C.coral : item.category === "Utility Notice" ? C.amber : C.teal;
  const bgColor = item.category === "Emergency Alert" ? "#FCE8EC" : item.category === "Utility Notice" ? "#FFF1D9" : "#E2F2EA";
  return (
    <Pressable style={({ pressed }) => [s.card, pressed && { opacity: .75 }]}>
      <View style={[s.icon, { backgroundColor: bgColor }]}>
        <IconSymbol name={item.category === "Emergency Alert" ? "exclamationmark.triangle.fill" : "bell.fill"} size={19} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.category, { color }]}>{item.category.toUpperCase()}</Text>
        <Text style={s.cardTitle}>{item.title}</Text>
        <Text style={s.message} numberOfLines={2}>{item.body}</Text>
        <Text style={s.date}>{dateStr}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={C.muted} />
    </Pressable>
  );
}

export default function NoticesScreen() {
  const { data, isLoading, error, refetch } = useNotices({ limit: 20 });
  const notices = data?.notices || [];

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 24 }}>
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>STAY INFORMED</Text>
              <Text style={s.title}>Notices</Text>
              <Text style={s.subtitle}>Updates from your ward office.</Text>
            </View>
            <Pressable onPress={() => router.push("/notifications")} style={s.bell}>
              <IconSymbol name="bell.fill" size={21} color={C.ink} />
            </Pressable>
          </View>
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading notices...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 24 }}>
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>STAY INFORMED</Text>
              <Text style={s.title}>Notices</Text>
              <Text style={s.subtitle}>Updates from your ward office.</Text>
            </View>
            <Pressable onPress={() => router.push("/notifications")} style={s.bell}>
              <IconSymbol name="bell.fill" size={21} color={C.ink} />
            </Pressable>
          </View>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Failed to load notices</Text>
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
        data={notices}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <View>
                <Text style={s.eyebrow}>STAY INFORMED</Text>
                <Text style={s.title}>Notices</Text>
                <Text style={s.subtitle}>Updates from your ward office.</Text>
              </View>
              <Pressable onPress={() => router.push("/notifications")} style={s.bell}>
                <IconSymbol name="bell.fill" size={21} color={C.ink} />
              </Pressable>
            </View>
            <Text style={s.section}>Latest updates</Text>
          </View>
        }
        renderItem={({ item }) => <NoticeCard item={item} />}
        ListEmptyComponent={<Text style={{ color: C.muted, marginTop: 30, textAlign: "center" }}>No notices yet.</Text>}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 30 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 25 }, eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { color: C.ink, fontSize: 30, fontWeight: "800", marginTop: 5 }, subtitle: { color: C.muted, fontSize: 14, marginTop: 6 }, bell: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }, badge: { position: "absolute", top: -2, right: -1, backgroundColor: C.coral, width: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.bg }, badgeText: { color: C.surface, fontSize: 9, fontWeight: "900" }, section: { color: C.ink, fontSize: 17, fontWeight: "800", marginBottom: 11 }, card: { backgroundColor: C.surface, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 11, borderWidth: 1, borderColor: C.border }, icon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" }, category: { fontSize: 10, fontWeight: "900", letterSpacing: .6 }, cardTitle: { color: C.ink, fontSize: 15, fontWeight: "800", marginTop: 5 }, message: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, date: { color: C.muted, fontSize: 10, marginTop: 6 } });
