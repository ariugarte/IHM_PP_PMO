import type { Task, TaskStatus } from '../../domain/models';

export function taskGateState(tasks: Task[]) {
  const counts = tasks.reduce<Record<TaskStatus, number>>((value, task) => ({ ...value, [task.status]: value[task.status] + 1 }), { queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0 });
  return {
    counts,
    hasFirstSuccess: counts.succeeded > 0,
    allTerminal: tasks.length > 0 && counts.queued + counts.running === 0,
    allFailed: tasks.length > 0 && counts.succeeded === 0 && counts.queued + counts.running === 0,
  };
}

export function pollingDelay(intervalMs: number, maxIntervalMs: number, consecutiveErrors: number) {
  return Math.min(intervalMs * 2 ** Math.max(0, consecutiveErrors), maxIntervalMs);
}
