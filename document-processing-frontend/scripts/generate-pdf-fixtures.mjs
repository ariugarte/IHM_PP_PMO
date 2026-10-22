import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/mock-pdfs');
mkdirSync(output, { recursive: true });

function escapePdfText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function makePdf(pageTexts) {
  const objects = [];
  const add = (value) => { objects.push(value); return objects.length; };
  const catalogId = add('');
  const pagesId = add('');
  const pageIds = [];
  const contentIds = [];
  for (const lines of pageTexts) {
    const pageId = add('');
    const commands = ['BT', '/F1 18 Tf', '72 760 Td', '22 TL', ...lines.flatMap((line, index) => index === 0 ? [`(${escapePdfText(line)}) Tj`] : ['T*', `(${escapePdfText(line)}) Tj`]), 'ET'].join('\n');
    const contentId = add(`<< /Length ${Buffer.byteLength(commands, 'latin1')} >>\nstream\n${commands}\nendstream`);
    pageIds.push(pageId);
    contentIds.push(contentId);
  }
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });
  let pdf = '%PDF-1.4\n%mock\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const fixtures = {
  'kbis-alpha.pdf': [['EXTRAIT K-BIS - SOCIETE ALPHA', 'SIREN 123 456 789', 'Page 1 / 2'], ['ANNEXE DES ACTIVITES', 'Conseil en systemes informatiques', 'Page 2 / 2']],
  'identity-alice.pdf': [['CARTE NATIONALE IDENTITE', 'DUPONT Alice', 'Document IDFRA-472901']],
  'passport-bob.pdf': [['PASSEPORT', 'MARTIN Bob', 'Numero 20AB34971']],
  'unknown-notice.pdf': [['DOCUMENT NON RECONNU', 'Reference ZX-908']],
  'mixed-dossier.pdf': [['CARTE IDENTITE', 'DURAND Chloe', 'Page 1 / 2'], ['PASSEPORT', 'DURAND Chloe', 'Page 2 / 2']],
  'kbis-gamma.pdf': [['EXTRAIT K-BIS - SOCIETE GAMMA', 'SIREN 987 654 321']],
};

for (const [filename, pages] of Object.entries(fixtures)) writeFileSync(resolve(output, filename), makePdf(pages));
