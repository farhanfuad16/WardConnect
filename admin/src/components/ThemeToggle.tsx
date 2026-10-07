import type { CSSProperties } from 'react';
import { useTheme } from '../lib/theme';

const SUN = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
const MOON = 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z';

/** Switches between light and dark. `style` overrides the default (dark sidebar) look. */
export default function ThemeToggle({ style, showLabel = true }: { style?: CSSProperties; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '100%',
        padding: '10px',
        marginBottom: '10px',
        background: 'rgba(94, 234, 212, 0.1)',
        color: '#5EEAD4',
        border: '1px solid rgba(94, 234, 212, 0.3)',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={isDark ? SUN : MOON} />
      </svg>
      {showLabel && (isDark ? 'Light mode' : 'Dark mode')}
    </button>
  );
}
