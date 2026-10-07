import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Switch, Text, TextInput, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/context/AuthContext";
import { useSubmitVolunteerInterest } from "@/hooks/useApi";
import { showAlert } from "@/lib/alert";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProfileScreen() {
  const { C, s } = useAppStyles(makeStyles);
  const { colorScheme, setColorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const { user, logout } = useAuthContext();
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [skills, setSkills] = useState("");
  const volunteerMutation = useSubmitVolunteerInterest();

  async function handleVolunteerSubmit() {
    try {
      await volunteerMutation.mutateAsync({ skillsOrInterest: skills.trim() || undefined });
      setShowVolunteerModal(false);
      setSkills("");
      showAlert("Thanks for volunteering", "Your ward admin can now see your offer and will reach out if there's a fit.");
    } catch (err: any) {
      showAlert("Couldn't record your offer", err?.message || "Something went wrong. Please try again.");
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleLogout() {
    showAlert("Sign out", "Are you sure you want to sign out?", [
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
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
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

        <Text style={s.section}>Community</Text>
        <Pressable onPress={() => setShowVolunteerModal(true)} style={s.row}>
          <View style={s.rowIcon}>
            <IconSymbol name="hand.raised.fill" size={19} color={C.teal} />
          </View>
          <Text style={s.rowText}>Volunteer for your ward</Text>
          <IconSymbol name="chevron.right" size={19} color={C.muted} />
        </Pressable>

        <Text style={s.section}>Preferences</Text>
        <View style={[s.row, { marginBottom: 10 }]}>
          <View style={s.rowIcon}>
            <IconSymbol name="moon.fill" size={19} color={C.teal} />
          </View>
          <Text style={s.rowText}>Dark mode</Text>
          <Switch
            value={isDark}
            onValueChange={(on) => setColorScheme(on ? "dark" : "light")}
            trackColor={{ false: C.border, true: C.teal }}
            thumbColor={isDark ? C.onColor : C.muted}
            accessibilityLabel="Dark mode"
          />
        </View>
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
      </ScrollView>

      <Modal visible={showVolunteerModal} transparent animationType="slide" onRequestClose={() => setShowVolunteerModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowVolunteerModal(false)}>
          <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Volunteer for your ward</Text>
              <Pressable onPress={() => setShowVolunteerModal(false)}>
                <IconSymbol name="xmark" size={22} color={C.muted} />
              </Pressable>
            </View>
            <Text style={s.modalSubtitle}>
              Tell {userWard === "No ward assigned" ? "your ward admin" : userWard} what you can help with — anything from distributing supplies to first aid. This isn't tied to a specific incident; the admin will reach out when there's a fit.
            </Text>
            <TextInput
              value={skills}
              onChangeText={setSkills}
              placeholder="e.g. First aid certified, have a van, fluent in Bangla and English (optional)"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              style={s.modalInput}
            />
            <Pressable
              onPress={handleVolunteerSubmit}
              disabled={volunteerMutation.isPending}
              style={[s.modalSubmit, volunteerMutation.isPending && { opacity: 0.6 }]}
            >
              {volunteerMutation.isPending ? (
                <ActivityIndicator color={C.onColor} size="small" />
              ) : (
                <Text style={s.modalSubmitText}>Send offer to admin</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { s } = useAppStyles(makeStyles);
  return (
    <View style={s.detail}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  content: { paddingTop: 24, paddingBottom: 30 },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2 },
  title: { color: C.ink, fontSize: 30, fontWeight: "700", marginTop: 5 },
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 22,
    marginBottom: 3,
    ...C.card,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: C.tealTintStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.teal, fontSize: 18, fontWeight: "600" },
  name: { color: C.ink, fontSize: 17, fontWeight: "700" },
  ward: { color: C.teal, fontSize: 13, fontWeight: "600", marginTop: 5 },
  section: { color: C.ink, fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 22 },
  details: {
    backgroundColor: C.surface,
    borderRadius: 17,
    paddingHorizontal: 15,
    marginBottom: 3,
    ...C.card,
  },
  detail: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  label: { color: C.muted, fontSize: 11, fontWeight: "600" },
  value: { color: C.ink, fontSize: 14, fontWeight: "600", marginTop: 4 },
  row: {
    backgroundColor: C.surface,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    ...C.card,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.tealTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { color: C.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  logout: {
    marginTop: 26,
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.coralBorder,
  },
  logoutText: { color: C.coral, fontWeight: "700", fontSize: 14 },
  version: { textAlign: "center", color: C.muted, fontSize: 11, marginTop: 28 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { color: C.ink, fontSize: 18, fontWeight: "700" },
  modalSubtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  modalInput: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, fontSize: 14, color: C.ink, minHeight: 90, textAlignVertical: "top", marginBottom: 16 },
  modalSubmit: { backgroundColor: C.teal, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", ...C.tealGlow },
  modalSubmitText: { color: C.onColor, fontSize: 15, fontWeight: "700" },
});
