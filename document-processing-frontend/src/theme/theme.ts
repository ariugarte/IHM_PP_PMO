import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#175CD3', dark: '#12395B' },
    secondary: { main: '#0E9384' },
    background: { default: '#F4F7FB', paper: '#FFFFFF' },
    text: { primary: '#172B4D', secondary: '#5D6B7A' },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', h4: { fontWeight: 750 }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 } },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 650 } } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #E1E7EF', boxShadow: '0 8px 26px rgba(31, 56, 88, .06)' } } },
  },
});
