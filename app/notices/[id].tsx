import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getNotice, type Notice } from "@/lib/api";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

export default function NoticeDetailScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const noticeId = Number(id);
    if (!Number.isInteger(noticeId) || noticeId <= 0) {
      setError("This notice could not be found.");
      setLoading(false);
      return;
    }

    getNotice(noticeId)
      .then((data) => setNotice(data.notice))
      .catch((err: any) => setError(err?.message || "Failed to load notice."))
      .finally(() => setLoading(false));
  }, [id]);

  const color = notice?.category === "Emergency Alert" ? C.coral : notice?.category === "Utility Notice" ? C.amber : C.teal;
  const icon = notice?.category === "Emergency Alert" ? "exclamationmark.triangle.fill" : "bell.fill";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.content}>
        <BackButton label="Back to notices" />
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={s.muted}>Loading notice...</Text>
          </View>
        ) : error || !notice ? (
          <View style={s.center}>
            <Text style={s.errorTitle}>Notice not found</Text>
            <Text style={s.muted}>{error || "This notice is no longer available."}</Text>
          </View>
        ) : (
          <View style={s.card}>
            <View style={[s.icon, { backgroundColor: `${color}20` }]}>
              <IconSymbol name={icon} size={24} color={color} />
            </View>
            <Text style={[s.category, { color }]}>{notice.category.toUpperCase()}</Text>
            <Text style={s.title}>{notice.title}</Text>
            <Text style={s.meta}>{new Date(notice.createdAt).toLocaleDateString()}</Text>
            <Text style={s.wardLabel}>Sent to</Text>
            <Text style={s.wardValue}>
              {notice.allWards ? "All wards" : notice.wards?.length ? notice.wards.map((ward) => ward.name).join(", ") : "Selected wards"}
            </Text>
            <View style={s.bodyDivider} />
            <Text style={s.body}>{notice.body}</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 32 },
  center: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  muted: { color: C.muted, fontSize: 13, marginTop: 12, textAlign: "center" },
  errorTitle: { color: C.coral, fontSize: 17, fontWeight: "700" },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  card: { backgroundColor: C.surface, borderRadius: 18, padding: 18, ...C.card },
  category: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  title: { color: C.ink, fontSize: 28, lineHeight: 34, fontWeight: "700", marginTop: 8 },
  meta: { color: C.muted, fontSize: 12, marginTop: 10 },
  wardLabel: { color: C.muted, fontSize: 11, fontWeight: "600", marginTop: 22, textTransform: "uppercase", letterSpacing: 0.6 },
  wardValue: { color: C.ink, fontSize: 14, fontWeight: "600", marginTop: 5 },
  bodyDivider: { height: 1, backgroundColor: C.border, marginVertical: 18 },
  body: { color: C.ink, fontSize: 15, lineHeight: 24 },
});
