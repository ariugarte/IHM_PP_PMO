import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import type { Task } from '../../domain/models';
import { StatusChip } from './StatusChip';

export function TaskProgress({ task }: { task: Task }) {
  return <Stack spacing={1} aria-live="polite">
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ fontWeight: 650 }}>{task.taskId}</Typography>
      <StatusChip status={task.status} />
    </Stack>
    {(task.status === 'queued' || task.status === 'running') && <Box><LinearProgress variant={task.progress === undefined ? 'indeterminate' : 'determinate'} value={task.progress} /></Box>}
    {task.message && <Typography color={task.status === 'failed' ? 'error' : 'text.secondary'} variant="body2">{task.message}</Typography>}
  </Stack>;
}
