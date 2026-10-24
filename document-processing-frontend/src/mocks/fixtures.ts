import type { Contract, DocumentResult, ExtractedField } from '../domain/models';

export const contracts: Contract[] = [
  {
    contractId: 'C-001', contractNumber: 'CTR-2026-001', label: 'Contrat Alpha', documents: [
      { documentId: 'D-001', contractId: 'C-001', filename: 'kbis_alpha.pdf', mimeType: 'application/pdf', pageCount: 2, sizeBytes: 1840 },
      { documentId: 'D-002', contractId: 'C-001', filename: 'identite_alice.pdf', mimeType: 'application/pdf', pageCount: 1, sizeBytes: 1100 },
    ],
  },
  {
    contractId: 'C-002', contractNumber: 'CTR-2026-002', label: 'Contrat Beta', documents: [
      { documentId: 'D-003', contractId: 'C-002', filename: 'passeport_bob.pdf', mimeType: 'application/pdf', pageCount: 1, sizeBytes: 1160 },
      { documentId: 'D-004', contractId: 'C-002', filename: 'annexe_inconnue.pdf', mimeType: 'application/pdf', pageCount: 1, sizeBytes: 1080 },
    ],
  },
  {
    contractId: 'C-003', contractNumber: 'CTR-2026-003', label: 'Contrat Gamma', documents: [
      { documentId: 'D-005', contractId: 'C-003', filename: 'dossier_mixte.pdf', mimeType: 'application/pdf', pageCount: 2, sizeBytes: 1880 },
      { documentId: 'D-006', contractId: 'C-003', filename: 'kbis_gamma.pdf', mimeType: 'application/pdf', pageCount: 1, sizeBytes: 1140 },
    ],
  },
];

const field = (key: string, value: ExtractedField['value'], confidence?: number, sourcePage?: number): ExtractedField => ({ key, value, confidence, sourcePage });

const pagesByDocument: Record<string, DocumentResult['pages']> = {
  'D-001': [
    { pageNumber: 1, documentTypeCode: 'KBIS', classificationConfidence: 0.96, ocrText: 'EXTRAIT K-BIS SOCIETE ALPHA SIREN 123 456 789', fields: [field('siren', '123456789', 0.97, 1), field('companyName', 'Société Alpha', 0.94, 1), field('registrationDate', '2020-04-12', 0.91, 1), field('address', '10 avenue de la République, 75011 Paris', 0.89, 1), field('greffe', 'Paris', 0.8, 1)] },
    { pageNumber: 2, documentTypeCode: 'OTHER', classificationConfidence: 0.71, ocrText: 'ANNEXE - ACTIVITES DE LA SOCIETE', fields: [field('activity', 'Conseil en systèmes informatiques', 0.84, 2)] },
  ],
  'D-002': [{ pageNumber: 1, documentTypeCode: 'IDENTITY_CARD', classificationConfidence: 0.98, ocrText: 'REPUBLIQUE FRANCAISE DUPONT ALICE', fields: [field('lastName', 'DUPONT', 0.99, 1), field('firstName', 'Alice', 0.98, 1), field('documentNumber', 'IDFRA-472901', 0.93, 1), field('dateOfBirth', '1988-11-03', 0.91, 1)] }],
  'D-003': [{ pageNumber: 1, documentTypeCode: 'PASSPORT', classificationConfidence: 0.97, ocrText: 'PASSEPORT MARTIN BOB NATIONALITE FRANCAISE', fields: [field('passportNumber', '20AB34971', 0.96, 1), field('lastName', 'MARTIN', 0.98, 1), field('nationality', 'Française', 0.94, 1), field('expiryDate', '2031-06-30', 0.9, 1)] }],
  'D-004': [{ pageNumber: 1, documentTypeCode: 'NOTICE_LEGACY', classificationConfidence: 0.54, ocrText: 'DOCUMENT NON RECONNU - REFERENCE ZX-908', fields: [field('legacyReference', 'ZX-908', 0.63, 1), field('comment', null, undefined, 1)] }],
  'D-005': [
    { pageNumber: 1, documentTypeCode: 'IDENTITY_CARD', classificationConfidence: 0.92, ocrText: 'CARTE IDENTITE DURAND CHLOE', fields: [field('lastName', 'DURAND', 0.94, 1), field('firstName', 'Chloé', 0.93, 1), field('documentNumber', 'IDFRA-110293', 0.87, 1)] },
    { pageNumber: 2, documentTypeCode: 'PASSPORT', classificationConfidence: 0.88, ocrText: 'PASSEPORT DURAND CHLOE', fields: [field('passportNumber', '17CD80120', 0.89, 2), field('nationality', 'Française', 0.9, 2), field('expiryDate', null, undefined, 2)] },
  ],
  'D-006': [{ pageNumber: 1, documentTypeCode: 'KBIS', classificationConfidence: 0.95, ocrText: 'EXTRAIT K-BIS SOCIETE GAMMA SIREN 987 654 321', fields: [field('siren', '987654321', 0.96, 1), field('companyName', 'Société Gamma', 0.93, 1), field('address', '4 rue du Port, 33000 Bordeaux', 0.88, 1)] }],
};

export const pdfByDocument: Record<string, string> = {
  'D-001': 'kbis-alpha.pdf', 'D-002': 'identity-alice.pdf', 'D-003': 'passport-bob.pdf',
  'D-004': 'unknown-notice.pdf', 'D-005': 'mixed-dossier.pdf', 'D-006': 'kbis-gamma.pdf',
};

export function fixtureDocumentId(documentId: string): string {
  if (pagesByDocument[documentId]) return documentId;
  if (!documentId.startsWith('document_')) return documentId;
  try {
    const encoded = documentId.slice('document_'.length).replaceAll('-', '+').replaceAll('_', '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const filename = new TextDecoder().decode(bytes).split('/').at(-1);
    return Object.entries(pdfByDocument).find(([, fixtureFilename]) => fixtureFilename === filename)?.[0] ?? documentId;
  } catch {
    return documentId;
  }
}

export function resultFor(taskId: string, contractId: string, documentId: string): DocumentResult {
  return { taskId, contractId, documentId, status: 'succeeded', pages: pagesByDocument[fixtureDocumentId(documentId)] ?? [] };
}
