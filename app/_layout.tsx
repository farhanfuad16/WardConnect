import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, router, useSegments, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, isLoading } = useAuthContext();
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F8F7" }}>
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
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
          <StatusBar style="dark" />
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
