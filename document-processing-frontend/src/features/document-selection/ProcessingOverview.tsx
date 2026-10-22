import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus } from '../../domain/models';
import { StatusChip } from '../../components/feedback/StatusChip';

export function ProcessingOverview({ tasks }: { tasks: Task[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!tasks.length) return null;
  const counts = tasks.reduce<Record<TaskStatus, number>>((acc, task) => ({ ...acc, [task.status]: acc[task.status] + 1 }), { queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0 });
  const partial = counts.succeeded > 0 && (counts.failed > 0 || counts.cancelled > 0);
  const allFailed = counts.succeeded === 0 && counts.queued + counts.running === 0;
  return <Card><CardContent><Stack spacing={2}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}><Typography variant="h6">{t('taskOverview')}</Typography><Stack direction="row" sx={{ gap: 1 }}>{(Object.keys(counts) as TaskStatus[]).map((status) => counts[status] > 0 && <Chip key={status} label={`${t(status)} · ${counts[status]}`} />)}</Stack></Stack>
    {tasks.map((task) => <Box key={task.taskId} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1, alignItems: 'center' }}><Box><Typography variant="body2" sx={{ fontWeight: 650 }}>{task.taskId} · {task.documentIds?.join(', ')}</Typography>{['queued', 'running'].includes(task.status) && <LinearProgress value={task.progress} variant={task.progress === undefined ? 'indeterminate' : 'determinate'} sx={{ mt: .75 }} />}{task.message && <Typography variant="caption" color={task.status === 'failed' ? 'error' : 'text.secondary'}>{task.message}</Typography>}</Box><StatusChip status={task.status} /></Box>)}
    {partial && <Alert severity="warning">{t('partialWarning')}</Alert>}
    {allFailed && <Alert severity="error">{t('allFailed')}</Alert>}
    {counts.succeeded > 0 && <Button variant="contained" color="success" onClick={() => navigate('/results')}>{t('seeResults')}</Button>}
  </Stack></CardContent></Card>;
}
