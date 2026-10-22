import type { AppConfig } from '../../config/schema';
import type { SourceSelection, Task } from '../../domain/models';
import { httpClient } from '../http';
import { endpoint } from '../routes';
import { adaptIntakeStart, adaptIntakeTask, toIntakeRequest } from './adapters';

export async function startIntake(config: AppConfig, source: SourceSelection, signal?: AbortSignal): Promise<Task> {
  const { url, route } = endpoint(config, 'source', 'startIntake');
  return adaptIntakeStart(await httpClient.json(url, { method: route.method, body: toIntakeRequest(source), signal }), config);
}

export async function getIntakeTask(config: AppConfig, taskId: string, signal?: AbortSignal): Promise<Task> {
  const { url } = endpoint(config, 'source', 'getTask', { taskId });
  return adaptIntakeTask(await httpClient.json(url, { signal }), config);
}
