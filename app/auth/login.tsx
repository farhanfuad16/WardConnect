import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
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

export default function LoginScreen() {
  const { login, isLoading: authLoading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  async function handleLogin() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const result = await login(email.trim(), password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the AuthContext updates and root layout redirects
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
        <View style={s.content}>
          <Text style={s.eyebrow}>WELCOME BACK</Text>
          <Text style={s.title}>Sign in</Text>
          <Text style={s.subtitle}>
            Sign in to your WardConnect account
          </Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

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
              autoComplete="password"
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={!canSubmit}
            style={[s.button, !canSubmit && s.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={s.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <Link href={"/auth/register" as Href} asChild>
              <Pressable>
                <Text style={s.footerLink}>Create one</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});
