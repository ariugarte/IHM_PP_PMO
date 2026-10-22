import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DocumentFieldDefinition } from '../../config/schema';
import type { ExtractedField } from '../../domain/models';

function displayValue(value: ExtractedField['value'], definition: DocumentFieldDefinition | undefined, locale: string, fallback: string) {
  if (value === null || value === '') return fallback;
  if (definition?.dataType === 'boolean') return value ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No');
  if (definition?.dataType === 'number' && typeof value === 'number') return new Intl.NumberFormat(locale).format(value);
  if (definition?.dataType === 'currency' && typeof value === 'number') return new Intl.NumberFormat(locale, { style: 'currency', currency: definition.formatter?.currency ?? 'EUR' }).format(value);
  if (definition?.dataType === 'date' && typeof value === 'string') {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat(locale, { dateStyle: definition.formatter?.dateStyle ?? 'medium' }).format(date);
  }
  return String(value);
}

export function FieldCard({ field, definition, showConfidence }: { field?: ExtractedField; definition: DocumentFieldDefinition; showConfidence: boolean }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en' : 'fr';
  const confidence = field?.confidence === undefined ? undefined : Math.round(field.confidence * 100);
  return <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 2 } }}><Stack spacing={.75}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{definition.label[locale]}</Typography>
    <Typography sx={{ whiteSpace: definition.dataType === 'multiline' ? 'pre-wrap' : 'normal', overflowWrap: 'anywhere' }}>{displayValue(field?.value ?? null, definition, locale, t('notProvided'))}</Typography>
    {showConfidence && confidence !== undefined && <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}><LinearProgress variant="determinate" value={confidence} sx={{ flex: 1 }} /><Typography variant="caption">{confidence}%</Typography></Stack>}
  </Stack></CardContent></Card>;
}

export function UnknownFieldCard({ field, showConfidence }: { field: ExtractedField; showConfidence: boolean }) {
  const definition: DocumentFieldDefinition = { key: field.key, label: { fr: field.key, en: field.key }, dataType: 'text', order: 999 };
  return <FieldCard field={field} definition={definition} showConfidence={showConfidence} />;
}
