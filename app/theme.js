// ─── Design Tokens ────────────────────────────────────────────────
export const colors = {
  bg: '#FCFAF7',           // Paper white
  card: '#ffffff',
  text: '#2D241E',         // Deep charcoal/brown
  muted: '#8e867e',
  primary: '#2D241E',      // Dark heritage brown
  primaryLight: '#A67C3D', // Bronze accent
  accent: '#DBB37C',       // Silk gold
  border: '#EADECB',       // Light beige border
  danger: '#b91c1c',
  success: '#15803d',
  disabled: '#d1cbc3',
  skeleton: '#e4ddd4',
  overlay: 'rgba(45,36,30,0.45)', // Matching primary tone
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text },
  h2: { fontSize: 22, fontWeight: '800', color: colors.text },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  price: { fontSize: 16, fontWeight: '800', color: colors.primary },
};
