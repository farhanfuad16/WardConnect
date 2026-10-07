import { useThemeContext } from "@/lib/theme-provider";

/**
 * Web build of useColorScheme — delegates to our manual ThemeContext instead
 * of the OS/browser preference, so light/dark stays in sync with the same
 * toggle on every platform (dark mode here is a manual choice, not
 * system-following).
 */
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
