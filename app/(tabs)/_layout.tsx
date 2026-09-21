import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { useAppColors } from "@/hooks/use-app-colors";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

type TabIconName = "house.fill" | "doc.text.fill" | "map.fill" | "bell.fill" | "person.fill";

function TabIcon({ name, color, focused }: { name: TabIconName; color: string; focused: boolean }) {
  const C = useAppColors();
  return (
    <View style={{ backgroundColor: focused ? C.tealTint : "transparent", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 4 }}>
      <IconSymbol name={name} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const C = useAppColors();
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const icon = (name: TabIconName) => ({ color, focused }: { color: string; focused: boolean }) => <TabIcon name={name} color={color} focused={focused} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.teal,
        tabBarInactiveTintColor: C.muted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          height: 64 + bottom,
          paddingTop: 8,
          paddingBottom: bottom,
          backgroundColor: C.surface,
          borderTopWidth: 0,
          ...C.shadow,
          // Lift the bar off the content: the standard card shadow sits below, so cast this one upward.
          ...(C.shadow.boxShadow ? { boxShadow: "0 -4px 18px rgba(15, 42, 42, 0.07)" } : { borderTopWidth: 1, borderTopColor: C.border }),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("house.fill") }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", tabBarIcon: icon("doc.text.fill") }} />
      <Tabs.Screen name="map" options={{ title: "Map", tabBarIcon: icon("map.fill") }} />
      <Tabs.Screen name="notices" options={{ title: "Notices", tabBarIcon: icon("bell.fill") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person.fill") }} />
    </Tabs>
  );
}
