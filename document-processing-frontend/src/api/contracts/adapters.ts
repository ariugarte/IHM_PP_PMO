import { z } from 'zod';
import { contractSchema, type Contract, type GedContractOption } from '../../domain/models';

const gedContractsWireSchema = z.object({ items: z.array(z.object({ contractNumber: z.string(), label: z.string().optional() })) });
const catalogWireSchema = z.object({ workflowId: z.string(), contracts: z.array(contractSchema) });

export const adaptGedContracts = (raw: unknown): GedContractOption[] => gedContractsWireSchema.parse(raw).items;
export const adaptCatalog = (raw: unknown): Contract[] => catalogWireSchema.parse(raw).contracts;
