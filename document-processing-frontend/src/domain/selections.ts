import type { Contract, ContractDocumentSelection } from './models';

export function toggleContractSelection(
  current: ContractDocumentSelection[],
  contract: Contract,
  selected: boolean,
): ContractDocumentSelection[] {
  const others = current.filter((item) => item.contractId !== contract.contractId);
  return selected && contract.documents.length
    ? [...others, { contractId: contract.contractId, documentIds: contract.documents.map((document) => document.documentId) }]
    : others;
}

export function toggleDocumentSelection(
  current: ContractDocumentSelection[],
  contractId: string,
  documentId: string,
  selected: boolean,
): ContractDocumentSelection[] {
  const existing = current.find((item) => item.contractId === contractId);
  const ids = new Set(existing?.documentIds ?? []);
  if (selected) ids.add(documentId); else ids.delete(documentId);
  const others = current.filter((item) => item.contractId !== contractId);
  return ids.size ? [...others, { contractId, documentIds: [...ids] }] : others;
}

export function selectionCounts(selections: ContractDocumentSelection[]) {
  return {
    contracts: selections.length,
    documents: selections.reduce((total, selection) => total + selection.documentIds.length, 0),
  };
}
