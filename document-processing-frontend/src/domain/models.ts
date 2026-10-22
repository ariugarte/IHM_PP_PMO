import { z } from 'zod';

export const sourceSelectionSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('filesystem'), folderPath: z.string().trim().min(1, 'Le chemin est obligatoire') }),
  z.object({
    source: z.literal('GED'),
    gedCategory: z.enum(['COLLECTIVE', 'SINISTRES'], { error: 'La catégorie est obligatoire' }),
    contractNumbers: z.array(z.string().min(1)).min(1, 'Sélectionnez au moins un contrat'),
  }),
]);
export type SourceSelection = z.infer<typeof sourceSelectionSchema>;

export const taskStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed', 'cancelled']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  taskId: z.string().min(1),
  status: taskStatusSchema,
  stage: z.enum(['intake', 'processing']),
  contractId: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
  errorCode: z.string().optional(),
});
export type Task = z.infer<typeof taskSchema>;

export const documentInfoSchema = z.object({
  documentId: z.string().min(1),
  contractId: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.literal('application/pdf'),
  pageCount: z.number().int().positive().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});
export type DocumentInfo = z.infer<typeof documentInfoSchema>;

export const contractSchema = z.object({
  contractId: z.string().min(1),
  contractNumber: z.string().min(1),
  label: z.string().optional(),
  documents: z.array(documentInfoSchema),
});
export type Contract = z.infer<typeof contractSchema>;

export const contractDocumentSelectionSchema = z.object({
  contractId: z.string().min(1),
  documentIds: z.array(z.string().min(1)).min(1),
});
export type ContractDocumentSelection = z.infer<typeof contractDocumentSelectionSchema>;

export const extractedFieldSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1).optional(),
  sourcePage: z.number().int().positive().optional(),
});
export type ExtractedField = z.infer<typeof extractedFieldSchema>;

export const classifiedPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  documentTypeCode: z.string().min(1),
  classificationConfidence: z.number().min(0).max(1).optional(),
  ocrText: z.string().optional(),
  fields: z.array(extractedFieldSchema),
});
export type ClassifiedPage = z.infer<typeof classifiedPageSchema>;

export const documentResultSchema = z.object({
  contractId: z.string().min(1),
  documentId: z.string().min(1),
  taskId: z.string().min(1),
  status: taskStatusSchema,
  pages: z.array(classifiedPageSchema),
});
export type DocumentResult = z.infer<typeof documentResultSchema>;

export type GedContractOption = { contractNumber: string; label?: string };
export type ChatContext = { workflowId: string; contractIds: string[]; documentIds: string[]; pageNumbers: number[] };
export type ChatReply = {
  conversationId: string;
  message: string;
  sources?: Array<{ documentId: string; pageNumber: number; fieldKey?: string }>;
};

export const isTerminalStatus = (status: TaskStatus) => ['succeeded', 'failed', 'cancelled'].includes(status);
