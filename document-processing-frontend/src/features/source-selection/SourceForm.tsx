import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { startIntake } from '../../api/intake/service';
import { useRuntimeConfig } from '../../config/ConfigContext';
import { sourceSelectionSchema, type SourceSelection } from '../../domain/models';
import { useWorkflowStore } from '../../state/workflowStore';
import { ErrorPanel } from '../../components/feedback/ErrorPanel';
import { TaskProgress } from '../../components/feedback/TaskProgress';

export function SourceForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { appConfig } = useRuntimeConfig();
  const queryClient = useQueryClient();
  const intakeTask = useWorkflowStore((state) => state.intakeTask);
  const setSourceSelection = useWorkflowStore((state) => state.setSourceSelection);
  const setIntakeTask = useWorkflowStore((state) => state.setIntakeTask);
  const completeIntake = useWorkflowStore((state) => state.completeIntake);
  const form = useForm<SourceSelection>({ resolver: zodResolver(sourceSelectionSchema), defaultValues: { clientType: 'PMO' } });
  const mutation = useMutation({
    mutationFn: (selection: SourceSelection) => startIntake(appConfig, selection),
    onSuccess: (task, selection) => {
      queryClient.removeQueries({ queryKey: ['task', 'intake', task.taskId] });
      setSourceSelection(selection);
      setIntakeTask(task);
      if (task.status === 'succeeded' && task.workflowId) {
        completeIntake(task.workflowId);
        navigate('/documents');
      }
    },
  });

  const resumePolling = () => {
    if (intakeTask) setIntakeTask({ ...intakeTask, errorCode: undefined, message: undefined });
  };

  return <Card sx={{ maxWidth: 820, mx: 'auto' }}><CardContent sx={{ p: { xs: 3, md: 4 } }}>
    <Stack spacing={3} component="form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormControl>
        <FormLabel sx={{ color: 'text.primary', fontWeight: 700 }}>{t('clientTypeQuestion')}</FormLabel>
        <Controller name="clientType" control={form.control} render={({ field, fieldState }) => <>
          <RadioGroup {...field} row sx={{ mt: 1.5, gap: 2 }}>
            {(['PMO', 'PP'] as const).map((clientType) => <FormControlLabel
              key={clientType}
              value={clientType}
              control={<Radio />}
              label={<Box><Typography sx={{ fontWeight: 700 }}>{t(clientType === 'PMO' ? 'legalEntity' : 'naturalPerson')}</Typography><Typography variant="body2" color="text.secondary">{t(clientType === 'PMO' ? 'legalEntityHelp' : 'naturalPersonHelp')}</Typography></Box>}
              sx={{ flex: 1, minWidth: 250, m: 0, p: 2, alignItems: 'flex-start', border: '1px solid', borderColor: field.value === clientType ? 'primary.main' : 'divider', borderRadius: 1, bgcolor: field.value === clientType ? 'rgba(0, 0, 143, .04)' : 'background.paper', transition: 'border-color .2s, background-color .2s' }}
            />)}
          </RadioGroup>
          <FormHelperText error={!!fieldState.error}>{fieldState.error?.message ?? t('clientTypeHelp')}</FormHelperText>
        </>}/>
      </FormControl>
      <Button size="large" variant="contained" type="submit" disabled={mutation.isPending || intakeTask?.status === 'queued' || intakeTask?.status === 'running'}>
        {mutation.isPending ? <CircularProgress size={22} color="inherit" /> : t('startAnalysis')}
      </Button>
      {mutation.isError && <ErrorPanel message={mutation.error instanceof Error ? mutation.error.message : t('networkError')} />}
      {intakeTask && <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}><TaskProgress task={intakeTask} />
        {intakeTask.errorCode === 'POLL_TIMEOUT' && <Button sx={{ mt: 2 }} onClick={resumePolling}>{t('retryPolling')}</Button>}
        {intakeTask.status === 'failed' && <FormHelperText error sx={{ mt: 1 }}>{intakeTask.message}</FormHelperText>}
        {intakeTask.status === 'succeeded' && intakeTask.workflowId && <Button sx={{ mt: 2 }} variant="contained" color="success" onClick={() => { completeIntake(intakeTask.workflowId!); navigate('/documents'); }}>{t('continue')}</Button>}
      </Box>}
    </Stack>
  </CardContent></Card>;
}

export function SourcePage() {
  const { t } = useTranslation();
  return <Stack spacing={1}>
    <Typography variant="h4">{t('sourceTitle')}</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>{t('sourceSubtitle')}</Typography>
    <Box sx={{ mt: 2 }}><SourceForm /></Box>
  </Stack>;
}
