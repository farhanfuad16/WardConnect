import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";

const C = {
  ink: "#102A2A",
  teal: "#0F766E",
  bg: "#F4F8F7",
  surface: "#FFFFFF",
  muted: "#64748B",
  border: "#DCE9E6",
  coral: "#D9485F",
};

type Ward = { id: number; name: string; code: string };

export default function RegisterScreen() {
  const { register, isLoading: authLoading } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [wardId, setWardId] = useState<number | null>(null);
  const [wardName, setWardName] = useState("");
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showWardPicker, setShowWardPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const base = getApiBaseUrl().replace(/\/$/, "");
        const res = await fetch(`${base}/api/wards`);
        const data = await res.json();
        setWards(data.wards || []);
      } catch {
        // Silently fail — wards list will be empty
      } finally {
        setWardsLoading(false);
      }
    })();
  }, []);

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    wardId !== null &&
    !loading;

  async function handleRegister() {
    if (!canSubmit || wardId === null) return;
    setLoading(true);
    setError("");

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      wardId,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, AuthContext updates and root layout redirects
  }

  function selectWard(ward: Ward) {
    setWardId(ward.id);
    setWardName(ward.name);
    setShowWardPicker(false);
  }

  if (authLoading) {
    return (
      <ScreenContainer containerClassName="bg-[#F4F8F7]" className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={C.teal} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#F4F8F7]" className="px-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.keyboard}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.content}>
            <Text style={s.eyebrow}>GET STARTED</Text>
            <Text style={s.title}>Create account</Text>
            <Text style={s.subtitle}>
              Join your ward's civic network
            </Text>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={s.field}>
              <Text style={s.label}>Full name</Text>
              <TextInput
                style={s.input}
                placeholder="Your full name"
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                placeholder="At least 6 characters"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Phone (optional)</Text>
              <TextInput
                style={s.input}
                placeholder="+880 1XXXXXXXXX"
                placeholderTextColor={C.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Ward</Text>
              <Pressable
                onPress={() => setShowWardPicker(true)}
                style={s.picker}
              >
                <Text
                  style={[
                    s.pickerText,
                    !wardName && { color: C.muted },
                  ]}
                >
                  {wardsLoading
                    ? "Loading wards..."
                    : wardName || "Select your ward"}
                </Text>
                <IconSymbol name="chevron.right" size={18} color={C.muted} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={!canSubmit}
              style={[s.button, !canSubmit && s.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.buttonText}>Create account</Text>
              )}
            </Pressable>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have an account? </Text>
              <Link href={"/auth/login" as Href} asChild>
                <Pressable>
                  <Text style={s.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ward picker modal */}
      <Modal
        visible={showWardPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWardPicker(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowWardPicker(false)}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select your ward</Text>
              <Pressable onPress={() => setShowWardPicker(false)}>
                <IconSymbol name="xmark" size={22} color={C.muted} />
              </Pressable>
            </View>
            {wardsLoading ? (
              <ActivityIndicator
                size="large"
                color={C.teal}
                style={{ marginVertical: 30 }}
              />
            ) : wards.length === 0 ? (
              <Text style={s.emptyText}>No wards available</Text>
            ) : (
              <FlatList
                data={wards}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => selectWard(item)}
                    style={[
                      s.wardItem,
                      wardId === item.id && s.wardItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        s.wardItemText,
                        wardId === item.id && s.wardItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {wardId === item.id && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={C.teal} />
                    )}
                  </Pressable>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { paddingTop: 60, paddingBottom: 30 },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: C.ink, fontSize: 30, fontWeight: "800", marginTop: 5 },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 30 },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { color: C.coral, fontSize: 13, fontWeight: "600" },
  field: { marginBottom: 18 },
  label: { color: C.ink, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.ink,
  },
  picker: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: { fontSize: 15, color: C.ink },
  button: {
    backgroundColor: C.teal,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.teal, fontSize: 14, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: { color: C.ink, fontSize: 18, fontWeight: "800" },
  emptyText: {
    color: C.muted,
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 30,
  },
  wardItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  wardItemSelected: { backgroundColor: "#E6F4F1" },
  wardItemText: { color: C.ink, fontSize: 15, fontWeight: "600" },
  wardItemTextSelected: { color: C.teal, fontWeight: "800" },
});
