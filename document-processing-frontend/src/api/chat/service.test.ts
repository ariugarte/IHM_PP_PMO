import { afterEach, describe, expect, it, vi } from 'vitest';
import { askChat } from './service';
import { testConfig } from '../../test/fixtures';

afterEach(() => vi.restoreAllMocks());

describe('chat service', () => {
  it('sends the selected workflow, contract, document and page context', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ conversationId: 'CHAT-1', message: 'ok', sources: [{ documentId: 'D-1', pageNumber: 2 }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await askChat(testConfig, 'CHAT-1', 'Quel champ ?', { workflowId: 'WF-1', contractIds: ['C-1'], documentIds: ['D-1'], pageNumbers: [2] });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ conversationId: 'CHAT-1', message: 'Quel champ ?', context: { workflowId: 'WF-1', contractIds: ['C-1'], documentIds: ['D-1'], pageNumbers: [2] } });
  });
});
