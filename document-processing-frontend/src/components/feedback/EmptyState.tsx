import { InboxOutlined } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

export function EmptyState({ message }: { message: string }) {
  return <Stack spacing={1.5} sx={{ alignItems: 'center', py: 6, color: 'text.secondary' }}><InboxOutlined fontSize="large" /><Typography>{message}</Typography></Stack>;
}
