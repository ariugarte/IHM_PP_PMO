import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { listGedContracts } from '../../api/contracts/service';
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
  const form = useForm<SourceSelection>({ resolver: zodResolver(sourceSelectionSchema), defaultValues: { source: 'filesystem', folderPath: '/data/contracts/2026' } });
  const source = useWatch({ control: form.control, name: 'source' });
  const gedQuery = useQuery({ queryKey: ['ged-contracts'], queryFn: ({ signal }) => listGedContracts(appConfig, signal), enabled: source === 'GED' });
  const mutation = useMutation({
    mutationFn: (selection: SourceSelection) => startIntake(appConfig, selection),
    onSuccess: (task, selection) => {
      queryClient.removeQueries({ queryKey: ['task', 'intake', task.taskId] });
      setSourceSelection(selection);
      setIntakeTask(task);
    },
  });

  const changeSource = (next: 'filesystem' | 'GED') => {
    form.clearErrors();
    form.reset(next === 'filesystem'
      ? { source: 'filesystem', folderPath: '/data/contracts/2026' }
      : { source: 'GED', gedCategory: 'COLLECTIVE', contractNumbers: [] });
  };

  const resumePolling = () => {
    if (intakeTask) setIntakeTask({ ...intakeTask, errorCode: undefined, message: undefined });
  };

  return <Card sx={{ maxWidth: 820, mx: 'auto' }}><CardContent sx={{ p: { xs: 3, md: 4 } }}>
    <Stack spacing={3} component="form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
      <FormControl>
        <FormLabel>{t('sourceTitle')}</FormLabel>
        <RadioGroup row value={source} onChange={(_, value) => changeSource(value as 'filesystem' | 'GED')} sx={{ mt: 1 }}>
          <FormControlLabel value="filesystem" control={<Radio />} label={t('filesystem')} />
          <FormControlLabel value="GED" control={<Radio />} label={t('ged')} />
        </RadioGroup>
      </FormControl>
      {source === 'filesystem' ? <Controller name="folderPath" control={form.control} render={({ field, fieldState }) => <TextField {...field} label={t('folderPath')} placeholder="/data/contracts" required error={!!fieldState.error} helperText={fieldState.error?.message ?? t('folderHelp')} />} /> : <>
        <Controller name="gedCategory" control={form.control} render={({ field, fieldState }) => <TextField {...field} select label={t('category')} required error={!!fieldState.error} helperText={fieldState.error?.message}>
          <MenuItem value="COLLECTIVE">{t('collective')}</MenuItem><MenuItem value="SINISTRES">{t('claims')}</MenuItem>
        </TextField>} />
        <Controller name="contractNumbers" control={form.control} render={({ field, fieldState }) => <Autocomplete
          multiple options={gedQuery.data ?? []} loading={gedQuery.isLoading} value={(gedQuery.data ?? []).filter((option) => field.value?.includes(option.contractNumber))}
          getOptionLabel={(option) => `${option.contractNumber}${option.label ? ` — ${option.label}` : ''}`}
          isOptionEqualToValue={(option, value) => option.contractNumber === value.contractNumber}
          onChange={(_, values) => field.onChange([...new Set(values.map((value) => value.contractNumber))])}
          renderValue={(values, getItemProps) => values.map((option, index) => <Chip label={option.contractNumber} {...getItemProps({ index })} key={option.contractNumber} />)}
          renderInput={(params) => <TextField {...params} label={t('contracts')} placeholder={t('selectContracts')} required error={!!fieldState.error} helperText={fieldState.error?.message} slotProps={{ ...params.slotProps, input: { ...params.slotProps.input, endAdornment: <>{gedQuery.isLoading && <CircularProgress size={18} />}{params.slotProps.input.endAdornment}</> } }} />}
        />} />
        {gedQuery.isError && <ErrorPanel message={gedQuery.error instanceof Error ? gedQuery.error.message : t('networkError')} onRetry={() => void gedQuery.refetch()} />}
      </>}
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
