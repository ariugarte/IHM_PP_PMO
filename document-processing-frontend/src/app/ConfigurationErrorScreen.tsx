import { Alert, AlertTitle, Box, Container, Typography } from '@mui/material';
import type { ConfigurationError } from '../config/load';

export function ConfigurationErrorScreen({ error }: { error: ConfigurationError | Error }) {
  return <Container maxWidth="sm" sx={{ py: 10 }}><Box sx={{ textAlign: 'center', mb: 3 }}><Typography variant="h4">Configuration invalide</Typography></Box>
    <Alert severity="error"><AlertTitle>Le démarrage a été interrompu</AlertTitle>{error.message}<br /><br />Corrigez les fichiers JSON servis sous <code>/config</code>, puis rechargez la page. Aucun mode simulé n’a été activé automatiquement.</Alert>
  </Container>;
}
