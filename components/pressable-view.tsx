import { useState } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Extra style while the finger is down (e.g. `{ opacity: 0.75 }`). */
  pressedStyle?: StyleProp<ViewStyle>;
};

/**
 * Pressable with a pressed-state style that also works in Expo Go.
 *
 * Don't write `<Pressable style={({ pressed }) => [...]}>`: in Expo Go on
 * Android that whole style function was ignored (NativeWind wraps every
 * component via `jsxImportSource`), so the home tiles, list cards and the
 * SOS / submit buttons lost their background, padding and radius and only
 * their text showed. This tracks "pressed" itself and only ever passes a
 * plain style array, which renders the same on native and web.
 */
export function PressableView({ style, pressedStyle, onPressIn, onPressOut, ...props }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[style, pressed && pressedStyle]}
    />
  );
}
