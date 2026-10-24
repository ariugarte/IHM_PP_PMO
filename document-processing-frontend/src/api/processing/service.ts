import type { AppConfig } from '../../config/schema';
import type { ContractAnalysisSelection, DocumentResult, Task } from '../../domain/models';
import { httpClient } from '../http';
import { endpoint } from '../routes';
import { adaptProcessingResults, adaptProcessingStart, adaptProcessingTask, toProcessingRequest } from './adapters';

export async function startProcessing(config: AppConfig, workflowId: string, selections: ContractAnalysisSelection[], signal?: AbortSignal): Promise<Task[]> {
  const { url, route } = endpoint(config, 'processing', 'startProcessing', { workflowId });
  return adaptProcessingStart(await httpClient.json(url, { method: route.method, body: toProcessingRequest(workflowId, selections), signal }), config);
}
export async function getProcessingTask(config: AppConfig, taskId: string, signal?: AbortSignal): Promise<Task> {
  const { url } = endpoint(config, 'processing', 'getTask', { taskId });
  return adaptProcessingTask(await httpClient.json(url, { signal }), config);
}
export async function getTaskResults(config: AppConfig, taskId: string, signal?: AbortSignal): Promise<DocumentResult[]> {
  const { url } = endpoint(config, 'processing', 'getTaskResults', { taskId });
  return adaptProcessingResults(await httpClient.json(url, { signal }));
}
