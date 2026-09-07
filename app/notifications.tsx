import { ActivityIndicator, FlatList, Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useApi";
import { type Notification } from "@/lib/api";

const C = { ink: "#102A2A", teal: "#0F766E", bg: "#F4F8F7", surface: "#FFFFFF", muted: "#64748B", border: "#DCE9E6", coral: "#D9485F", amber: "#D97706" };

function NotificationCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  const dateStr = new Date(item.createdAt).toLocaleDateString();
  const isEmergency = item.title.toLowerCase().includes("emergency") || item.title.toLowerCase().includes("sos") || item.title.toLowerCase().includes("flood");
  const type = isEmergency ? "Emergency Alert" : "General Notice";
  return (
    <Pressable onPress={onPress} style={[s.card, !item.isRead && s.unread]}>
      <View style={[s.icon, { backgroundColor: isEmergency ? "#FCE8EC" : "#FFF1D9" }]}>
        <IconSymbol name={isEmergency ? "exclamationmark.triangle.fill" : "bell.fill"} size={19} color={isEmergency ? C.coral : C.amber} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.typeRow}>
          <Text style={s.type}>{type.toUpperCase()}</Text>
          {!item.isRead && <View style={s.dot} />}
        </View>
        <Text style={s.cardTitle}>{item.title}</Text>
        <Text style={s.message}>{item.body}</Text>
        <Text style={s.date}>{dateStr}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { data, isLoading, error, refetch } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.notifications || [];

  const handleReadAll = () => {
    markAllRead.mutate();
  };

  const handlePressItem = (item: Notification) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 20 }}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back}>
              <IconSymbol name="arrow.left" size={21} color={C.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>YOUR UPDATES</Text>
              <Text style={s.title}>Notifications</Text>
            </View>
          </View>
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ color: C.muted, marginTop: 12 }}>Loading notifications...</Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
        <View style={{ flex: 1, paddingTop: 20 }}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back}>
              <IconSymbol name="arrow.left" size={21} color={C.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>YOUR UPDATES</Text>
              <Text style={s.title}>Notifications</Text>
            </View>
          </View>
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ color: C.coral, fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Failed to load notifications</Text>
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
        data={items}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.back}>
              <IconSymbol name="arrow.left" size={21} color={C.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>YOUR UPDATES</Text>
              <Text style={s.title}>Notifications</Text>
            </View>
            <Pressable onPress={handleReadAll}>
              <Text style={s.readAll}>Read all</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <NotificationCard item={item} onPress={() => handlePressItem(item)} />}
        ListEmptyComponent={<Text style={{ color: C.muted, marginTop: 30, textAlign: "center" }}>No notifications yet.</Text>}
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({ content: { paddingTop: 20, paddingBottom: 30 }, header: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 25 }, back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" }, eyebrow: { color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, title: { color: C.ink, fontSize: 27, fontWeight: "800", marginTop: 3 }, readAll: { color: C.teal, fontWeight: "800", fontSize: 12 }, card: { backgroundColor: C.surface, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: "row", gap: 11, borderWidth: 1, borderColor: C.border }, unread: { borderColor: "#B8DDD4", backgroundColor: "#FCFFFE" }, icon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" }, typeRow: { flexDirection: "row", alignItems: "center", gap: 7 }, type: { color: C.muted, fontSize: 10, fontWeight: "900", letterSpacing: .5 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.coral }, cardTitle: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 5 }, message: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, date: { color: C.muted, fontSize: 10, marginTop: 6 } });
