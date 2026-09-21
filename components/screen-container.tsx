import { View, StyleSheet, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useAppColors } from "@/hooks/use-app-colors";

// ── Why this doesn't use NativeWind's `className` for anything functional ──
//
// NativeWind compiles `className="..."` into real styles by statically
// scanning literal strings at each JSX call site. A wrapper component that
// takes a `className` PROP and re-applies it to an inner element
// (`<View className={someProp}>`) breaks that: the value is a variable, not
// a literal, both at this call site and at every caller's call site (they're
// setting a prop on ScreenContainer, not writing className on a real host
// element). Nothing here gets compiled, so on web every one of these classes
// silently no-ops — verified via devtools: not one of them produced a
// matching CSS rule, and computed padding/flex/background all fell back to
// the browser/RN-Web defaults. This was the actual cause of screens
// rendering with zero edge padding and a transparent (not the theme
// background) — a much bigger issue than it looked at a glance.
//
// Every current call site in the app only ever passes one of a small,
// fixed set of class combinations, so instead of chasing NativeWind's
// prop-forwarding limitation, this reproduces those exact combinations as
// real inline styles (RN's own style prop always works). If a screen needs
// something this doesn't cover, add a prop for it rather than a new
// className string — a new className here will silently do nothing again.
const styles = StyleSheet.create({
  flex: { flex: 1 },
  paddedX: { paddingHorizontal: 20 },
  centered: { alignItems: "center", justifyContent: "center" },
});

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /** Center content both ways instead of the default padded column — for full-screen loading/spinner states. */
  centered?: boolean;
  /** Skip the default 20px horizontal padding. Most screens want it. */
  noPadding?: boolean;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer>
 *   <Text>Welcome</Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  centered,
  noPadding,
  style,
  ...props
}: ScreenContainerProps) {
  const { bg } = useAppColors();
  return (
    <View style={[styles.flex, { backgroundColor: bg }]} {...props}>
      <SafeAreaView edges={edges} style={[styles.flex, style]}>
        <View style={[styles.flex, !noPadding && styles.paddedX, centered && styles.centered]}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
