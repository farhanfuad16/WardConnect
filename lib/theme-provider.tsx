import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform, View, Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

const THEME_KEY = "wardconnect_theme";

async function getStoredScheme(): Promise<ColorScheme | null> {
  try {
    const value = Platform.OS === "web" ? window.localStorage.getItem(THEME_KEY) : await SecureStore.getItemAsync(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

async function setStoredScheme(scheme: ColorScheme): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(THEME_KEY, scheme);
    } else {
      await SecureStore.setItemAsync(THEME_KEY, scheme);
    }
  } catch {
    // Non-fatal — theme just won't persist across restarts.
  }
}

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Manual toggle only — this intentionally does not follow the OS/browser
  // preference. It defaults to light until the user picks a theme, and that
  // choice is what persists (not the system setting).
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("light");

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
    setStoredScheme(scheme);
  }, [applyScheme]);

  // Load the persisted choice once on mount.
  useEffect(() => {
    getStoredScheme().then((stored) => {
      if (stored) {
        setColorSchemeState(stored);
        applyScheme(stored);
      } else {
        applyScheme("light");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
    }),
    [colorScheme, setColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
