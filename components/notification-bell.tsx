import { Pressable, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUnreadNotificationCount } from "@/hooks/useApi";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

/** Header bell that opens notifications. The red dot shows only while something is unread. */
export function NotificationBell({ size = 22 }: { size?: number }) {
  const { C, s } = useAppStyles(makeStyles);
  const unread = useUnreadNotificationCount();
  return (
    <Pressable onPress={() => router.push("/notifications")} style={s.bell} accessibilityLabel="Notifications">
      <IconSymbol name="bell.fill" size={size} color={C.ink} />
      {unread > 0 && <View style={s.dot} />}
    </Pressable>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  bell: { height: 46, width: 46, borderRadius: 23, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", ...C.card },
  dot: { position: "absolute", top: 8, right: 9, width: 11, height: 11, borderRadius: 6, backgroundColor: C.coralFill, borderWidth: 2, borderColor: C.surface },
});
