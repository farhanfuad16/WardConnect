import { useMemo } from "react";
import type { ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Light/dark values for the app-specific colors that aren't part of the core
// theme palette (theme.config.js): the pastel "tint" backgrounds behind status
// icons/pills, plus the one-off surfaces individual screens used to hardcode.
// The dark values are desaturated and darkened so they read as a subtle chip
// against the dark surface/background instead of glowing.
const EXTRAS_LIGHT = {
  // Text/icons drawn on top of a solid teal/coral/amber fill.
  onColor: "#FFFFFF",
  // Solid button/tile fills. Light mode = the normal accents; dark mode uses
  // deeper shades (the bright dark-mode accents read as pastel when filled).
  tealFill: "#0F766E",
  coralFill: "#D9485F",
  onFill: "#FFFFFF",
  coralTint: "#FCE8EC",
  amberTint: "#FFF1D9",
  greenTint: "#E2F2EA",
  tealTint: "#E3F1EC",
  tealTintStrong: "#D6EFEB",
  switcherBg: "#E6F0EE",
  mapBg: "#DDEAE4",
  road: "#F7FBF9",
  unreadBg: "#FCFFFE",
  unreadBorder: "#B8DDD4",
  timelineLine: "#B9DED5",
  coralBorder: "#F1C3CB",
  coralSelectedBg: "#FFF6F7",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  selectedBg: "#E6F4F1",
  safetyText: "#48705E",
};

const EXTRAS_DARK: typeof EXTRAS_LIGHT = {
  onColor: "#0B0F12",
  tealFill: "#0F766E",
  coralFill: "#C63E55",
  onFill: "#FFFFFF",
  coralTint: "#4A2530",
  amberTint: "#453A22",
  greenTint: "#1F3D2E",
  tealTint: "#1A2F2E",
  tealTintStrong: "#1F3B39",
  switcherBg: "#0B0D10",
  mapBg: "#1E2628",
  road: "#2E383A",
  unreadBg: "#1C2A2B",
  unreadBorder: "#2B5B55",
  timelineLine: "#2F4A47",
  coralBorder: "#6B3540",
  coralSelectedBg: "#3A2028",
  errorBg: "#3B1E26",
  errorBorder: "#6B3540",
  selectedBg: "#1A2F2E",
  safetyText: "#9BCBB0",
};

// Elevation. Soft shadows carry the card look in light mode; in dark mode they
// vanish against the background, so cards there fall back to a hairline border.
const SHADOWS_LIGHT = {
  soft: "0 1px 2px rgba(15, 42, 42, 0.04), 0 4px 14px rgba(15, 42, 42, 0.06)",
  teal: "0 4px 12px rgba(15, 118, 110, 0.22)",
  coral: "0 4px 12px rgba(217, 72, 95, 0.22)",
};

/**
 * Maps the theme's semantic palette onto the short color-key names every
 * screen already uses (ink/teal/bg/coral/...), so swapping a screen's old
 * hardcoded `const C = {...}` for `const C = useAppColors()` is a one-line
 * change that doesn't require touching any of its `C.xxx` call sites.
 */
export function useAppColors() {
  const t = useColors();
  const scheme = useColorScheme();
  return useMemo(() => {
    const dark = scheme === "dark";
    // Spread these into a StyleSheet entry: `...C.card` for a raised surface,
    // `...C.shadow` for just the elevation, `...C.tealGlow` under a primary button.
    const shadow: ViewStyle = dark ? {} : { boxShadow: SHADOWS_LIGHT.soft };
    const card: ViewStyle = dark ? { borderWidth: 1, borderColor: t.border } : { borderWidth: 0, ...shadow };
    const tealGlow: ViewStyle = dark ? {} : { boxShadow: SHADOWS_LIGHT.teal };
    const coralGlow: ViewStyle = dark ? {} : { boxShadow: SHADOWS_LIGHT.coral };
    return {
      shadow,
      card,
      tealGlow,
      coralGlow,
      ink: t.foreground,
      teal: t.primary,
      bg: t.background,
      surface: t.surface,
      muted: t.muted,
      border: t.border,
      coral: t.error,
      amber: t.warning,
      green: t.success,
      ...(dark ? EXTRAS_DARK : EXTRAS_LIGHT),
    };
  }, [t, scheme]);
}

export type AppColors = ReturnType<typeof useAppColors>;

/**
 * Themed colors plus a StyleSheet built from them. Pass a module-level
 * `makeStyles(C)` factory (keep it outside the component so its identity is
 * stable); styles are rebuilt only when the theme changes.
 */
export function useAppStyles<T>(makeStyles: (C: AppColors) => T) {
  const C = useAppColors();
  const s = useMemo(() => makeStyles(C), [C, makeStyles]);
  return { C, s };
}
