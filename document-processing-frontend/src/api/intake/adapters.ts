import { z } from 'zod';
import type { AppConfig } from '../../config/schema';
import { taskSchema, type SourceSelection, type Task } from '../../domain/models';
import { normalizeTaskStatus } from '../../domain/status';

const intakeStartWireSchema = z.object({ taskId: z.string(), status: z.unknown() });
const intakeTaskWireSchema = z.object({
  taskId: z.string(), status: z.unknown(), workflowId: z.string().optional(), progress: z.number().optional(),
  message: z.string().optional(), errorCode: z.string().optional(), result: z.object({ workflowId: z.string().optional() }).optional(),
});

export function toIntakeRequest(source: SourceSelection): unknown {
  return source.source === 'filesystem'
    ? { source: source.source, folderPath: source.folderPath }
    : { source: source.source, gedCategory: source.gedCategory, contractNumbers: source.contractNumbers };
}

export function adaptIntakeStart(raw: unknown, config: AppConfig): Task {
  const wire = intakeStartWireSchema.parse(raw);
  return taskSchema.parse({ taskId: wire.taskId, status: normalizeTaskStatus(wire.status, config.taskStatus), stage: 'intake' });
}

export function adaptIntakeTask(raw: unknown, config: AppConfig): Task {
  const wire = intakeTaskWireSchema.parse(raw);
  return taskSchema.parse({
    taskId: wire.taskId,
    status: normalizeTaskStatus(wire.status, config.taskStatus),
    stage: 'intake',
    workflowId: wire.workflowId ?? wire.result?.workflowId,
    progress: wire.progress,
    message: wire.message,
    errorCode: wire.errorCode,
  });
}
