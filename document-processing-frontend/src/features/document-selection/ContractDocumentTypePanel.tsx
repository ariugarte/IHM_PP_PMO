import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, FormControlLabel, FormGroup, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DocumentSearchTypeGroup } from '../../config/schema';

type Props = {
  contractId: string;
  groups: DocumentSearchTypeGroup[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function ContractDocumentTypePanel({ contractId, groups, selectedIds, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en' : 'fr';
  const allIds = useMemo(() => groups.flatMap((group) => group.types.map((type) => type.id)), [groups]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (typeId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(typeId); else next.delete(typeId);
    onChange(allIds.filter((typeIdInConfig) => next.has(typeIdInConfig)));
  };

  return <Accordion disableGutters elevation={0} square sx={{ border: 0, borderBottom: '1px solid', borderColor: 'divider', boxShadow: 'none', bgcolor: 'rgba(0, 0, 143, .025)' }}>
    <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`document-types-${contractId}`}>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>{t('documentTypesToSearch')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('documentTypesSelected', { selected: selectedIds.length, total: allIds.length })}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails id={`document-types-${contractId}`} sx={{ px: { xs: 2, md: 3 }, pt: 0, pb: 3 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => onChange(allIds)}>{t('selectAllTypes')}</Button>
          <Button size="small" onClick={() => onChange([])} disabled={!selectedIds.length}>{t('clearTypes')}</Button>
        </Stack>
        {groups.map((group) => <Box key={group.id}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>{group.label[locale]}</Typography>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3 }}>
            {group.types.map((type) => <FormControlLabel
              key={type.id}
              control={<Checkbox size="small" checked={selected.has(type.id)} onChange={(_, checked) => toggle(type.id, checked)} />}
              label={type.label[locale]}
              sx={{ alignItems: 'flex-start', py: .25, '& .MuiFormControlLabel-label': { pt: .75 } }}
            />)}
          </FormGroup>
        </Box>)}
      </Stack>
    </AccordionDetails>
  </Accordion>;
}
