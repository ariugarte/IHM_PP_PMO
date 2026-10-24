import { delay, http, HttpResponse, passthrough } from 'msw';
import type { AppConfig } from '../config/schema';
import type { ContractDocumentSelection, TaskStatus } from '../domain/models';
import { contracts, fixtureDocumentId, pdfByDocument, resultFor } from './fixtures';

type SimulatedTask = { taskId: string; stage: 'intake' | 'processing'; polls: number; contractId?: string; documentIds?: string[]; fail: boolean; successAfter: number };

export function createHandlers(scenario: AppConfig['mock']['scenario']) {
  const storageKey = `document-analysis-mock-engine-${scenario}`;
  const restored = (() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) ?? '{}') as { tasks?: SimulatedTask[]; processingAttempt?: number }; }
    catch { return {}; }
  })();
  const tasks = new Map<string, SimulatedTask>((restored.tasks ?? []).map((task) => [task.taskId, task]));
  let processingAttempt = restored.processingAttempt ?? 0;
  const persist = () => sessionStorage.setItem(storageKey, JSON.stringify({ tasks: [...tasks.values()], processingAttempt }));

  const taskStatus = (task: SimulatedTask): TaskStatus => {
    if (task.fail && task.polls >= task.successAfter) return 'failed';
    if (task.polls >= task.successAfter) return 'succeeded';
    if (task.polls >= 2) return 'running';
    return 'queued';
  };

  return [
    http.post('/backend/source/v1/intakes', async ({ request }) => {
      const body = await request.clone().json() as Record<string, unknown>;
      if (body.clientType === 'PMO' || body.clientType === 'PP') return passthrough();
      return HttpResponse.json({ message: 'Type de client invalide', code: 'INVALID_CLIENT_TYPE' }, { status: 422 });
    }),
    http.get('/backend/source/v1/tasks/:taskId', async ({ params }) => {
      if (String(params.taskId).startsWith('FS-')) return passthrough();
      const task = tasks.get(String(params.taskId));
      if (!task) return HttpResponse.json({ message: 'Tâche inconnue' }, { status: 404 });
      task.polls += 1;
      persist();
      await delay(80);
      const status = taskStatus(task);
      return HttpResponse.json({ taskId: task.taskId, status, workflowId: status === 'succeeded' ? 'WF-001' : undefined, progress: status === 'queued' ? 10 : status === 'running' ? 62 : 100, message: status === 'failed' ? 'La collecte simulée a échoué.' : undefined, errorCode: status === 'failed' ? 'MOCK_INTAKE_FAILURE' : undefined });
    }),
    http.get('/backend/catalog/v1/workflows/:workflowId/contracts', async ({ params }) => {
      if (String(params.workflowId).startsWith('FS-')) return passthrough();
      if (params.workflowId !== 'WF-001') return HttpResponse.json({ message: 'Workflow inconnu' }, { status: 404 });
      await delay(100);
      return HttpResponse.json({ workflowId: params.workflowId, contracts });
    }),
    http.post('/backend/processing/v1/workflows/:workflowId/processing-jobs', async ({ request, params }) => {
      const body = await request.json() as { selections?: ContractDocumentSelection[] };
      const workflowId = String(params.workflowId);
      if ((workflowId !== 'WF-001' && !workflowId.startsWith('FS-')) || !body.selections?.length || body.selections.some((selection) => !selection.documentIds.length)) {
        return HttpResponse.json({ message: 'Sélection invalide', code: 'INVALID_SELECTION' }, { status: 422 });
      }
      processingAttempt += 1;
      let index = 0;
      const created = body.selections.flatMap((selection) => selection.documentIds.map((documentId) => {
        index += 1;
        const task: SimulatedTask = {
          taskId: `TASK-${processingAttempt}-${String(index).padStart(3, '0')}`,
          stage: 'processing', polls: 0, contractId: selection.contractId, documentIds: [documentId],
          fail: scenario === 'partial-failure' && index % 3 === 0,
          successAfter: scenario === 'slow-processing' ? index + 5 : index + 2,
        };
        tasks.set(task.taskId, task);
        return { taskId: task.taskId, status: 'queued', contractId: task.contractId, documentIds: task.documentIds };
      }));
      persist();
      return HttpResponse.json({ tasks: created }, { status: 202 });
    }),
    http.get('/backend/processing/v1/tasks/:taskId', async ({ params }) => {
      const task = tasks.get(String(params.taskId));
      if (!task || task.stage !== 'processing') return HttpResponse.json({ message: 'Tâche inconnue' }, { status: 404 });
      task.polls += 1;
      persist();
      await delay(60);
      const status = taskStatus(task);
      return HttpResponse.json({ taskId: task.taskId, status, contractId: task.contractId, documentIds: task.documentIds, progress: status === 'queued' ? 5 : status === 'running' ? Math.min(90, 25 + task.polls * 12) : 100, message: status === 'failed' ? 'OCR indisponible pour ce document (scénario simulé).' : undefined, errorCode: status === 'failed' ? 'MOCK_OCR_FAILURE' : undefined });
    }),
    http.get('/backend/processing/v1/tasks/:taskId/results', ({ params }) => {
      const task = tasks.get(String(params.taskId));
      if (!task) return HttpResponse.json({ message: 'Tâche inconnue' }, { status: 404 });
      if (taskStatus(task) !== 'succeeded') return HttpResponse.json({ message: 'Résultat pas encore disponible' }, { status: 409 });
      const documents = (task.documentIds ?? []).map((documentId) => resultFor(task.taskId, task.contractId ?? '', documentId));
      return HttpResponse.json({ taskId: task.taskId, documents });
    }),
    http.get('/backend/catalog/v1/workflows/:workflowId/documents/:documentId/content', async ({ params }) => {
      if (String(params.workflowId).startsWith('FS-')) return passthrough();
      const filename = pdfByDocument[String(params.documentId)];
      if (!filename) return HttpResponse.json({ message: 'PDF inconnu' }, { status: 404 });
      const response = await fetch(`/mock-pdfs/${filename}`);
      const body = await response.arrayBuffer();
      return new HttpResponse(body, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(body.byteLength), 'Accept-Ranges': 'bytes' } });
    }),
    http.post('/backend/chat/v1/chat', async ({ request }) => {
      const body = await request.json() as { conversationId?: string; message?: string; context?: { documentIds?: string[]; pageNumbers?: number[] } };
      const documentId = body.context?.documentIds?.[0] ?? 'D-001';
      const fixtureId = fixtureDocumentId(documentId);
      const pageNumber = body.context?.pageNumbers?.[0] ?? 1;
      const lower = body.message?.toLowerCase() ?? '';
      const message = lower.includes('siren')
        ? fixtureId === 'D-006' ? 'Le numéro SIREN détecté est 987 654 321.' : 'Le numéro SIREN détecté est 123 456 789.'
        : `Pour le document ${documentId}, la page ${pageNumber} est utilisée comme contexte. Je peux expliquer les champs extraits ou leur confiance.`;
      await delay(220);
      return HttpResponse.json({ conversationId: body.conversationId ?? 'CHAT-001', message, sources: [{ documentId, pageNumber, fieldKey: lower.includes('siren') ? 'siren' : undefined }] });
    }),
  ];
}
