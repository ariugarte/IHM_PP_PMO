import { z } from 'zod';
import { contractSchema, type Contract } from '../../domain/models';

const catalogWireSchema = z.object({ workflowId: z.string(), contracts: z.array(contractSchema) });

export const adaptCatalog = (raw: unknown): Contract[] => catalogWireSchema.parse(raw).contracts;
