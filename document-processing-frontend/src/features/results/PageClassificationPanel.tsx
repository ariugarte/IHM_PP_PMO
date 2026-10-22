import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { ExpandMore, Search } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTypeBadge } from '../../components/cards/DocumentTypeBadge';
import { FieldCard, UnknownFieldCard } from '../../components/cards/FieldCard';
import { useRuntimeConfig } from '../../config/ConfigContext';
import type { ClassifiedPage } from '../../domain/models';

export function PageClassificationPanel({ page, totalPages = page.pageNumber }: { page: ClassifiedPage; totalPages?: number }) {
  const { t } = useTranslation();
  const { appConfig, documentTypes } = useRuntimeConfig();
  const [filter, setFilter] = useState('');
  const definition = documentTypes.types.find((type) => type.code === page.documentTypeCode);
  const configuredKeys = new Set(definition?.fields.map((field) => field.key) ?? []);
  const knownFields = (definition?.fields ?? []).slice().sort((a, b) => a.order - b.order).filter((field) => field.label.fr.toLowerCase().includes(filter.toLowerCase()) || field.key.toLowerCase().includes(filter.toLowerCase()));
  const unknownFields = page.fields.filter((field) => !configuredKeys.has(field.key) && field.key.toLowerCase().includes(filter.toLowerCase()));
  return <Stack spacing={2}>
    <Box><Typography variant="overline">{t('page', { current: page.pageNumber, total: totalPages })}</Typography><Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}><DocumentTypeBadge definition={definition} code={page.documentTypeCode} />{appConfig.features.showConfidence && page.classificationConfidence !== undefined && <Typography variant="body2" color="text.secondary">{t('confidence', { value: Math.round(page.classificationConfidence * 100) })}</Typography>}</Stack></Box>
    <TextField size="small" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={t('search')} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
    <Stack spacing={1}>{knownFields.map((fieldDefinition) => <FieldCard key={fieldDefinition.key} definition={fieldDefinition} field={page.fields.find((field) => field.key === fieldDefinition.key)} showConfidence={appConfig.features.showConfidence} />)}</Stack>
    {unknownFields.length > 0 && <><Divider /><Typography variant="subtitle2">{t('otherFields')}</Typography><Stack spacing={1}>{unknownFields.map((field) => <UnknownFieldCard key={field.key} field={field} showConfidence={appConfig.features.showConfidence} />)}</Stack></>}
    {page.ocrText && <Accordion variant="outlined" disableGutters><AccordionSummary expandIcon={<ExpandMore />}><Typography sx={{ fontWeight: 650 }}>{t('rawOcr')}</Typography></AccordionSummary><AccordionDetails><Typography component="pre" variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace' }}>{page.ocrText}</Typography></AccordionDetails></Accordion>}
  </Stack>;
}
