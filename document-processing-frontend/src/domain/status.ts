import type { AppConfig } from '../config/schema';
import type { TaskStatus } from './models';

export class UnknownTaskStatusError extends Error {
  constructor(status: string) {
    super(`Statut de tâche inconnu: ${status}`);
    this.name = 'UnknownTaskStatusError';
  }
}

export function normalizeTaskStatus(value: unknown, aliases: AppConfig['taskStatus']): TaskStatus {
  if (typeof value !== 'string') throw new UnknownTaskStatusError(String(value));
  const normalized = value.toLowerCase();
  for (const [canonical, values] of Object.entries(aliases) as Array<[TaskStatus, string[]]>) {
    if (values.some((alias) => alias.toLowerCase() === normalized)) return canonical;
  }
  throw new UnknownTaskStatusError(value);
}
