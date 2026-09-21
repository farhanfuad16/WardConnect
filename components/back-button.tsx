import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppStyles, type AppColors } from "@/hooks/use-app-colors";

/**
 * The standard "go back" control for pushed/modal screens. Styled as a
 * chrome pill (surface + border) to match the rest of the app's button and
 * chip language — a bare icon+text row with no container reads as dated and
 * has no real touch target padding.
 */
export function BackButton({
  label = "Back",
  onPress,
  style,
}: {
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { C, s } = useAppStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [s.button, pressed && s.pressed, style]}
      hitSlop={4}
    >
      <IconSymbol name="arrow.left" size={17} color={C.ink} />
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  pressed: { opacity: 0.7 },
  label: { color: C.ink, fontWeight: "600", fontSize: 13 },
});
