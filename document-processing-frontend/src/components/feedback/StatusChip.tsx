import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { TaskStatus } from '../../domain/models';

const colors: Record<TaskStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  queued: 'default', running: 'info', succeeded: 'success', failed: 'error', cancelled: 'warning',
};

export function StatusChip({ status, size = 'small' }: { status: TaskStatus; size?: 'small' | 'medium' }) {
  const { t } = useTranslation();
  return <Chip size={size} color={colors[status]} label={t(status)} variant={status === 'queued' ? 'outlined' : 'filled'} />;
}
