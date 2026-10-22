import { describe, expect, it } from 'vitest';
import { selectionCounts, toggleContractSelection, toggleDocumentSelection } from './selections';
import type { Contract } from './models';

const contract: Contract = { contractId: 'C-1', contractNumber: 'CTR-1', documents: [
  { documentId: 'D-1', contractId: 'C-1', filename: 'one.pdf', mimeType: 'application/pdf' },
  { documentId: 'D-2', contractId: 'C-1', filename: 'two.pdf', mimeType: 'application/pdf' },
] };

describe('contract/document selection', () => {
  it('selects all children, supports indeterminate refinement, and never emits an empty contract', () => {
    let selections = toggleContractSelection([], contract, true);
    expect(selections[0]?.documentIds).toEqual(['D-1', 'D-2']);
    selections = toggleDocumentSelection(selections, 'C-1', 'D-2', false);
    expect(selections).toEqual([{ contractId: 'C-1', documentIds: ['D-1'] }]);
    selections = toggleDocumentSelection(selections, 'C-1', 'D-1', false);
    expect(selections).toEqual([]);
  });

  it('keeps stable IDs and exact counts independently of display ordering', () => {
    const selections = [{ contractId: 'C-2', documentIds: ['D-9'] }, { contractId: 'C-1', documentIds: ['D-2', 'D-1'] }];
    expect(selectionCounts(selections)).toEqual({ contracts: 2, documents: 3 });
  });
});
