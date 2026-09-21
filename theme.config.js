/** @type {const} */
const themeColors = {
  // Dark primary is brighter than the light one: #0F766E is only ~2.3:1
  // against the dark surface, too low for links, icons and the active tab.
  primary: { light: '#0F766E', dark: '#2DD4BF' },
  background: { light: '#F4F8F7', dark: '#0F1115' },
  surface: { light: '#FFFFFF', dark: '#1A1D23' },
  foreground: { light: '#102A2A', dark: '#ECEDEE' },
  muted: { light: '#64748B', dark: '#9BA1A6' },
  border: { light: '#DCE9E6', dark: '#2A2E35' },
  success: { light: '#2F855A', dark: '#70C79A' },
  warning: { light: '#D97706', dark: '#F5B64A' },
  error: { light: '#D9485F', dark: '#F27D8D' },
};

module.exports = { themeColors };
