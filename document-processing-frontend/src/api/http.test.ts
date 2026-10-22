import { describe, expect, it } from 'vitest';
import { buildEndpoint } from './http';

describe('buildEndpoint', () => {
  const route = { method: 'GET' as const, path: '/v1/workflows/{workflowId}/documents/{documentId}' };

  it('encodes every path segment and structured query exactly once', () => {
    expect(buildEndpoint('/backend/catalog', route, { workflowId: 'WF/1', documentId: 'D é' }, { q: 'A&B', tag: ['un deux', 'trois'] }))
      .toBe('/backend/catalog/v1/workflows/WF%2F1/documents/D%20%C3%A9?q=A%26B&tag=un+deux&tag=trois');
  });

  it('rejects missing, unknown and cross-origin parameters', () => {
    expect(() => buildEndpoint('/backend/catalog', route, { workflowId: 'WF' })).toThrow('manquants');
    expect(() => buildEndpoint('/backend/catalog', route, { workflowId: 'WF', documentId: 'D', extra: 'x' })).toThrow('inconnus');
    expect(() => buildEndpoint('https://private.example', route, { workflowId: 'WF', documentId: 'D' })).toThrow('non autorisée');
  });
});
