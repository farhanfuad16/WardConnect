import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

/**
 * Drop-in replacement for React Native's Alert.alert.
 *
 * react-native-web's Alert.alert is a no-op (`static alert() {}`), so on web
 * none of the button callbacks passed to it ever fire — confirmations
 * (logout, submitting a report, sending an SOS, etc.) silently do nothing.
 * This falls back to window.confirm/alert on web so those callbacks still
 * run, while leaving native behavior untouched.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const list = buttons && buttons.length > 0 ? buttons : [{ text: "OK" } as AlertButton];
  const text = [title, message].filter(Boolean).join("\n\n");

  if (list.length === 1) {
    window.alert(text);
    list[0].onPress?.();
    return;
  }

  const cancelButton = list.find((b) => b.style === "cancel");
  const confirmButton = list.find((b) => b.style !== "cancel") ?? list[0];

  if (window.confirm(text)) {
    confirmButton.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
