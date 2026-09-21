import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/context/AuthContext";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

export default function LoginScreen() {
  const { C, s } = useAppStyles(makeStyles);
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
      <ScreenContainer centered>
        <ActivityIndicator size="large" color={C.teal} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.keyboard}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <View style={s.content}>
          <View style={s.brand}>
            <IconSymbol name="shield.fill" size={30} color={C.onColor} />
          </View>
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
              <ActivityIndicator color={C.onColor} size="small" />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingTop: 48, paddingBottom: 30 },
  brand: { width: 60, height: 60, borderRadius: 20, backgroundColor: C.teal, alignItems: "center", justifyContent: "center", marginBottom: 24, ...C.tealGlow },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1.2 },
  title: { color: C.ink, fontSize: 30, fontWeight: "700", marginTop: 5 },
  subtitle: { color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 30 },
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.errorBorder,
  },
  errorText: { color: C.coral, fontSize: 13, fontWeight: "600" },
  field: { marginBottom: 18 },
  label: { color: C.ink, fontSize: 13, fontWeight: "600", marginBottom: 6 },
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
    marginTop: 10, ...C.tealGlow },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: C.onColor, fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.teal, fontSize: 14, fontWeight: "600" },
});
