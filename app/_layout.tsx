import { useEffect } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import { Stack, router, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

// NativeWind (react-native-css-interop) reads React Native's deprecated SafeAreaView
// export at startup. The app itself uses react-native-safe-area-context; the warning's
// toast sits over the tab bar in Expo Go and swallows taps until dismissed.
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const queryClient = new QueryClient();

function ThemedStatusBar() {
  return <StatusBar style={useColorScheme() === "dark" ? "light" : "dark"} />;
}

function AuthGate() {
  const { user, isLoading } = useAuthContext();
  const C = useAppColors();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login" as Href);
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)" as Href);
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.teal} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="report/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="sos" options={{ presentation: "modal" }} />
      <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
      <Stack.Screen name="report/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="incident/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
