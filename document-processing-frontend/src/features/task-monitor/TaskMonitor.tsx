import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRuntimeConfig } from '../../config/ConfigContext';
import { isTerminalStatus, type Task } from '../../domain/models';
import { getIntakeTask } from '../../api/intake/service';
import { getProcessingTask } from '../../api/processing/service';
import { useWorkflowStore } from '../../state/workflowStore';
import { pollingDelay } from './polling';

function TaskWatcher({ reference, enabled }: { reference: Task; enabled: boolean }) {
  const { appConfig } = useRuntimeConfig();
  const { t } = useTranslation();
  const startedAt = useRef<number | null>(null);
  const setIntakeTask = useWorkflowStore((state) => state.setIntakeTask);
  const updateProcessingTask = useWorkflowStore((state) => state.updateProcessingTask);
  const timedOut = reference.errorCode === 'POLL_TIMEOUT';

  useEffect(() => {
    startedAt.current ??= Date.now();
  }, []);
  const query = useQuery({
    queryKey: ['task', reference.stage, reference.taskId],
    queryFn: ({ signal }) => reference.stage === 'intake'
      ? getIntakeTask(appConfig, reference.taskId, signal)
      : getProcessingTask(appConfig, reference.taskId, signal),
    enabled: enabled && !timedOut,
    retry: false,
    refetchInterval: (state) => {
      const task = state.state.data;
      return task && isTerminalStatus(task.status) ? false : pollingDelay(appConfig.polling.intervalMs, appConfig.polling.maxIntervalMs, state.state.fetchFailureCount);
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!query.data) return;
    if (reference.stage === 'intake') setIntakeTask(query.data); else updateProcessingTask(query.data);
  }, [query.data, reference.stage, setIntakeTask, updateProcessingTask]);

  useEffect(() => {
    if (!query.error || isTerminalStatus(reference.status) || reference.errorCode === 'POLL_TRANSIENT') return;
    const next = { ...reference, message: query.error instanceof Error ? query.error.message : t('networkError'), errorCode: 'POLL_TRANSIENT' };
    if (reference.stage === 'intake') setIntakeTask(next); else updateProcessingTask(next);
  }, [query.error, reference, setIntakeTask, t, updateProcessingTask]);

  useEffect(() => {
    if (isTerminalStatus(reference.status) || timedOut) return;
    const remaining = appConfig.polling.maxDurationMs - (startedAt.current ? Date.now() - startedAt.current : 0);
    const timeout = window.setTimeout(() => {
      const next = { ...reference, message: t('statusUnknown'), errorCode: 'POLL_TIMEOUT' };
      if (reference.stage === 'intake') setIntakeTask(next); else updateProcessingTask(next);
    }, Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
  }, [appConfig.polling.maxDurationMs, reference, setIntakeTask, t, timedOut, updateProcessingTask]);

  return null;
}

export function TaskMonitor({ children }: { children: ReactNode }) {
  const { appConfig } = useRuntimeConfig();
  const intakeTask = useWorkflowStore((state) => state.intakeTask);
  const tasks = useWorkflowStore((state) => state.processingTasks);
  const queryClient = useQueryClient();
  const activeIds = useMemo(() => tasks.filter((task) => !isTerminalStatus(task.status)).slice(0, appConfig.polling.concurrency).map((task) => task.taskId), [appConfig.polling.concurrency, tasks]);

  useEffect(() => {
    const onFocus = () => { void queryClient.invalidateQueries({ queryKey: ['task'] }); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [queryClient]);

  return <>
    {intakeTask && <TaskWatcher reference={intakeTask} enabled />}
    {tasks.map((task) => <TaskWatcher key={task.taskId} reference={task} enabled={isTerminalStatus(task.status) || activeIds.includes(task.taskId)} />)}
    {children}
  </>;
}
