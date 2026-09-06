import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#185adb', dark: '#1d43bb', light: '#edf2ff' },
    secondary: { main: '#122c48' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
    text: { primary: '#122c48', secondary: '#65738b' },
    divider: '#e4e9f2',
    success: { main: '#16755c' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 13,
    h1: { fontSize: '1.35rem', fontWeight: 750, letterSpacing: '-0.045em', lineHeight: 1.2 },
    h2: { fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    button: { fontSize: '0.875rem', fontWeight: 650, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 37, borderRadius: 8 }, outlined: { borderColor: '#dce3f0' } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff', fontSize: '0.875rem', borderRadius: 8 },
        notchedOutline: { borderColor: '#dce3ed' },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiCheckbox: { defaultProps: { size: 'small' }, styleOverrides: { root: { padding: 5 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 9, fontSize: '0.8125rem' }, icon: { fontSize: 19 } } },
    MuiLink: { defaultProps: { underline: 'hover' } },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', fontSize: '0.875rem', fontWeight: 650, borderColor: '#dce3ed',
          '&.Mui-selected': { color: '#185adb', backgroundColor: '#edf2ff' },
        },
      },
    },
  },
});
