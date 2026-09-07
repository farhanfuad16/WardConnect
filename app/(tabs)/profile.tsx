import { Alert, Platform, Pressable, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/context/AuthContext";

const C = {
  ink: "#102A2A",
  teal: "#0F766E",
  bg: "#F4F8F7",
  surface: "#FFFFFF",
  muted: "#64748B",
  border: "#DCE9E6",
  coral: "#D9485F",
};

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleLogout() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("Are you sure you want to sign out?")) {
        void logout();
      }
      return;
    }

    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  }

  const userName = user?.name || "User";
  const userWard = user?.wardName || "No ward assigned";

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
      <View style={s.content}>
        <Text style={s.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={s.title}>Profile</Text>

        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(userName)}</Text>
          </View>
          <View>
            <Text style={s.name}>{userName}</Text>
            <Text style={s.ward}>{userWard}</Text>
          </View>
        </View>

        <Text style={s.section}>Personal details</Text>
        <View style={s.details}>
          <Detail label="Email" value={user?.email || "—"} />
          <Detail label="Phone" value={user?.phone || "—"} />
          <Detail label="Ward" value={userWard} />
        </View>

        <Text style={s.section}>Preferences</Text>
        <Pressable style={s.row}>
          <View style={s.rowIcon}>
            <IconSymbol name="gearshape.fill" size={19} color={C.teal} />
          </View>
          <Text style={s.rowText}>Notification settings</Text>
          <IconSymbol name="chevron.right" size={19} color={C.muted} />
        </Pressable>

        <Pressable onPress={handleLogout} style={s.logout}>
          <IconSymbol name="arrow.left" size={19} color={C.coral} />
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>

        <Text style={s.version}>WardConnect · v1.0 · Your local civic layer</Text>
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detail}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 30 },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.ink, fontSize: 30, fontWeight: "800", marginTop: 5 },
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 22,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#D6EFEB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.teal, fontSize: 18, fontWeight: "900" },
  name: { color: C.ink, fontSize: 17, fontWeight: "800" },
  ward: { color: C.teal, fontSize: 13, fontWeight: "700", marginTop: 5 },
  section: { color: C.ink, fontSize: 17, fontWeight: "800", marginBottom: 11, marginTop: 2 },
  details: {
    backgroundColor: C.surface,
    borderRadius: 17,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: C.border,
  },
  detail: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { color: C.muted, fontSize: 11, fontWeight: "700" },
  value: { color: C.ink, fontSize: 14, fontWeight: "700", marginTop: 4 },
  row: {
    backgroundColor: C.surface,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#E3F1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { color: C.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  logout: {
    marginTop: 26,
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1C3CB",
  },
  logoutText: { color: C.coral, fontWeight: "800", fontSize: 14 },
  version: { textAlign: "center", color: C.muted, fontSize: 11, marginTop: 28 },
});
