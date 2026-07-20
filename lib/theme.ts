import { StyleSheet } from 'react-native';

// Shared color constants
export const colors = {
  primary: '#007AFF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  bgLight: '#F5F5F7',
  bgGray: '#E5E5EA',
  border: '#ddd',
  textDark: '#333',
  textMid: '#666',
  textMuted: '#999',
  white: '#fff',
};

// Shared styles — spread into any StyleSheet.create() or use directly
export const sharedStyles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  field: { marginBottom: 16 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  placeholder: {
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 32, fontWeight: 'bold', color: colors.textMuted },
  image: { width: '100%', height: '100%' },
});