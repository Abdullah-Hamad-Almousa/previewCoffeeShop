import { StyleSheet } from 'react-native';

// ============================================================
// Mystic Coffee — Steampunk Theme
// ============================================================
// Colors: dark brass, copper, deep browns, cream text
// Feel: Victorian industrial — gears, leather, brass pipes
// ============================================================

export const colors = {
  // Primary actions — brass/gold
  primary: '#B8860B',      // dark goldenrod (brass)
  primaryDark: '#8B6914',  // darker brass for pressed states
  accent: '#B87333',       // copper

  // Backgrounds
  bgDark: '#1A1410',       // near-black brown (main bg)
  bgCard: '#241D17',       // dark brown card bg
  bgMid: '#2E251E',        // slightly lighter brown
  bgLight: '#3A2F26',      // lightest brown variant
  bgGray: '#3A2F26',       // alias for bgLight (backward compat)
  bgCream: '#F5E6D3',      // cream for contrast cards

  // Text
  textLight: '#F5E6D3',    // cream text on dark
  textMid: '#C4A882',      // muted brass text
  textMuted: '#8B7355',    // dim copper text
  textDark: '#1A1410',     // dark text on light surfaces

  // Semantic
  danger: '#A0522D',       // sienna
  success: '#6B8E23',      // olive green
  warning: '#CD853F',      // peru
  rating: '#DAA520',       // goldenrod for stars

  // Borders / dividers
  border: '#4A3B2E',       // brown border
  borderLight: '#5A4A3A',  // lighter brown border
  divider: '#3A2F26',

  // Special
  copper: '#B87333',
  brass: '#B8860B',
  steam: '#D4C5A9',        // steam/vapor color
  white: '#FFFFFF',
};

// Shared styles — steampunk flavored
export const sharedStyles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: colors.brass },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.bgMid,
    color: colors.textLight,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: colors.textMid,
  },
  field: { marginBottom: 16 },
  primaryBtn: {
    backgroundColor: colors.brass,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: colors.bgDark, fontSize: 17, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  placeholder: {
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.copper,
  },
  image: { width: '100%', height: '100%' },
  // Shared card style (dark brown, bordered)
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Shared section title (cream text)
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 12,
  },
});