import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function ErrorPanel({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return <Alert severity="error"><AlertTitle>{title ?? t('networkError')}</AlertTitle><Stack spacing={1}>{message}{onRetry && <Button color="inherit" onClick={onRetry}>{t('retry')}</Button>}</Stack></Alert>;
}
