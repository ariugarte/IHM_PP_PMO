import { z } from 'zod';
import type { AppConfig } from '../../config/schema';
import { documentResultSchema, taskSchema, type ContractAnalysisSelection, type DocumentResult, type Task } from '../../domain/models';
import { normalizeTaskStatus } from '../../domain/status';

const taskWireSchema = z.object({
  taskId: z.string(), status: z.unknown(), contractId: z.string().optional(), documentIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(), progress: z.number().optional(), message: z.string().optional(), errorCode: z.string().optional(),
});
const processingStartWireSchema = z.object({ tasks: z.array(taskWireSchema) });
const resultsWireSchema = z.object({ taskId: z.string(), documents: z.array(z.unknown()) });

const adaptTask = (raw: unknown, config: AppConfig): Task => {
  const wire = taskWireSchema.parse(raw);
  return taskSchema.parse({ ...wire, status: normalizeTaskStatus(wire.status, config.taskStatus), stage: 'processing' });
};

export const toProcessingRequest = (workflowId: string, selections: ContractAnalysisSelection[]) => ({ workflowId, selections });
export const adaptProcessingStart = (raw: unknown, config: AppConfig): Task[] => processingStartWireSchema.parse(raw).tasks.map((task) => adaptTask(task, config));
export const adaptProcessingTask = (raw: unknown, config: AppConfig): Task => adaptTask(raw, config);
export const adaptProcessingResults = (raw: unknown): DocumentResult[] => resultsWireSchema.parse(raw).documents.map((document) => documentResultSchema.parse(document));
