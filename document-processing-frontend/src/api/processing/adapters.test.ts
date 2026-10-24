import { describe, expect, it } from 'vitest';
import { adaptProcessingResults, adaptProcessingStart, toProcessingRequest } from './adapters';
import { testConfig } from '../../test/fixtures';

describe('processing adapters', () => {
  it('builds the exact contract-to-document payload without empty contracts', () => {
    expect(toProcessingRequest('WF-1', [{ contractId: 'C-1', documentIds: ['D-2'], documentTypeIds: ['CNI', 'PASSPORT'] }])).toEqual({ workflowId: 'WF-1', selections: [{ contractId: 'C-1', documentIds: ['D-2'], documentTypeIds: ['CNI', 'PASSPORT'] }] });
  });

  it('preserves multiple task/document associations', () => {
    const tasks = adaptProcessingStart({ tasks: [
      { taskId: 'T-1', status: 'PENDING', contractId: 'C-1', documentIds: ['D-1'] },
      { taskId: 'T-2', status: 'STARTED', contractId: 'C-1', documentIds: ['D-2', 'D-3'] },
    ] }, testConfig);
    expect(tasks.map((task) => task.documentIds)).toEqual([['D-1'], ['D-2', 'D-3']]);
  });

  it('keeps page-scoped fields and partial document results', () => {
    const results = adaptProcessingResults({ taskId: 'T-1', documents: [{ contractId: 'C-1', documentId: 'D-1', taskId: 'T-1', status: 'succeeded', pages: [
      { pageNumber: 1, documentTypeCode: 'KBIS', fields: [{ key: 'siren', value: '123', sourcePage: 1 }] },
      { pageNumber: 2, documentTypeCode: 'OTHER', fields: [] },
    ] }] });
    expect(results[0]?.pages.map((page) => page.documentTypeCode)).toEqual(['KBIS', 'OTHER']);
  });
});
