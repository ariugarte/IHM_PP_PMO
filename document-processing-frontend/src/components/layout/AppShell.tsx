import { Language, Refresh } from '@mui/icons-material';
import { AppBar, Box, Button, Chip, Container, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRuntimeConfig } from '../../config/ConfigContext';
import { useWorkflowStore } from '../../state/workflowStore';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { WorkflowStepper } from './WorkflowStepper';

const stepByRoute: Record<string, number> = { '/source': 0, '/documents': 1, '/results': 2 };

export function AppShell({ children }: { children: ReactNode }) {
  const { appConfig } = useRuntimeConfig();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reset = useWorkflowStore((state) => state.reset);
  const [confirming, setConfirming] = useState(false);
  const activeStep = stepByRoute[location.pathname] ?? 0;

  const restart = () => {
    reset();
    queryClient.clear();
    setConfirming(false);
    navigate('/source');
  };

  const changeLanguage = async () => {
    const language = i18n.language.startsWith('fr') ? 'en' : 'fr';
    await i18n.changeLanguage(language);
    document.documentElement.lang = language;
  };

  return <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main', borderTop: '4px solid', borderColor: 'secondary.main' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Box component="img" src="/axa-logo.svg" alt="AXA" sx={{ width: 46, height: 46, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}><Typography variant="h6" component="div" noWrap>{appConfig.app.name || t('appName')}</Typography><Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, opacity: .8 }}>AXA France</Typography></Box>
        {appConfig.mock.enabled && <Chip label={t('demoMode')} size="small" sx={{ bgcolor: '#FFF1C2', color: '#6D4E00', fontWeight: 700 }} />}
        <Tooltip title={t('language')}><IconButton color="inherit" onClick={() => void changeLanguage()} aria-label={t('language')}><Language /></IconButton></Tooltip>
        <Button color="inherit" startIcon={<Refresh />} onClick={() => setConfirming(true)}>{t('restart')}</Button>
      </Toolbar>
    </AppBar>
    <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}><WorkflowStepper activeStep={activeStep} /></Box>
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, flex: 1 }}>{children}</Container>
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', py: 2 }}><Container maxWidth="xl"><Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}><Box component="img" src="/axa-logo.svg" alt="" aria-hidden="true" sx={{ width: 28, height: 28 }} /><Typography variant="body2" color="text.secondary">AXA France · {t('proofOfConcept')}</Typography></Stack></Container></Box>
    <ConfirmDialog open={confirming} title={t('restart')} message={t('confirmRestart')} onCancel={() => setConfirming(false)} onConfirm={restart} />
  </Box>;
}
