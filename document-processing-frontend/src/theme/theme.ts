import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00008F', light: '#4976BA', dark: '#00005B', contrastText: '#FFFFFF' },
    secondary: { main: '#FF1721', dark: '#C9141C', contrastText: '#FFFFFF' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#1F2937', secondary: '#596579' },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: '"Source Sans 3", Arial, system-ui, sans-serif', h4: { color: '#00008F', fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 } },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 650 } } },
    MuiCard: { styleOverrides: { root: { border: '1px solid #DDE3EE', boxShadow: '0 8px 26px rgba(0, 0, 143, .06)' } } },
    MuiAccordion: { styleOverrides: { root: { border: '1px solid #DDE3EE', boxShadow: '0 4px 14px rgba(0, 0, 143, .05)', '&::before': { display: 'none' } } } },
  },
});
