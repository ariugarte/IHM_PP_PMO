import type { AppConfig, DocumentSearchTypesConfig, DocumentTypeRegistry } from '../config/schema';

export const testConfig: AppConfig = {
  version: 1,
  app: { name: 'Test', defaultLocale: 'fr' },
  mock: { enabled: true, scenario: 'happy-path' },
  features: { chatEnabled: true, showConfidence: true },
  polling: { intervalMs: 100, maxIntervalMs: 1000, maxDurationMs: 5000, concurrency: 2 },
  taskStatus: {
    queued: ['queued', 'PENDING'], running: ['running', 'STARTED'], succeeded: ['succeeded', 'SUCCESS'],
    failed: ['failed', 'FAILURE'], cancelled: ['cancelled', 'REVOKED'],
  },
  backends: {
    source: { basePath: '/backend/source', routes: { startIntake: { method: 'POST', path: '/v1/intakes' }, getTask: { method: 'GET', path: '/v1/tasks/{taskId}' } } },
    catalog: { basePath: '/backend/catalog', routes: { listContractsWithDocuments: { method: 'GET', path: '/v1/workflows/{workflowId}/contracts' }, getPdf: { method: 'GET', path: '/v1/workflows/{workflowId}/documents/{documentId}/content' } } },
    processing: { basePath: '/backend/processing', routes: { startProcessing: { method: 'POST', path: '/v1/workflows/{workflowId}/processing-jobs' }, getTask: { method: 'GET', path: '/v1/tasks/{taskId}' }, getTaskResults: { method: 'GET', path: '/v1/tasks/{taskId}/results' } } },
    chat: { basePath: '/backend/chat', routes: { ask: { method: 'POST', path: '/v1/chat' } } },
  },
};

export const testRegistry: DocumentTypeRegistry = {
  version: 1,
  types: [{ code: 'KBIS', label: { fr: 'Extrait Kbis', en: 'Company registry excerpt' }, fields: [
    { key: 'siren', label: { fr: 'Numéro SIREN', en: 'SIREN number' }, dataType: 'text', order: 10 },
    { key: 'companyName', label: { fr: 'Raison sociale', en: 'Company name' }, dataType: 'text', order: 20 },
  ] }],
};

export const testSearchTypes: DocumentSearchTypesConfig = {
  version: 1,
  clientTypes: {
    PP: { groups: [{ id: 'JDI', label: { fr: 'Justificatifs d’identité', en: 'Identity documents' }, types: [{ id: 'CNI', label: { fr: 'Carte nationale d’identité', en: 'National identity card' } }] }] },
    PMO: { groups: [{ id: 'ALL_PMO', label: { fr: 'Justificatifs PMO', en: 'Legal-entity documents' }, types: [{ id: 'KBIS', label: { fr: 'Extrait Kbis', en: 'Kbis extract' } }] }] },
  },
};
