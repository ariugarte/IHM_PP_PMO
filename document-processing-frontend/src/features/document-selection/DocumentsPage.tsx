import { ExpandMore, Search } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listContracts } from '../../api/contracts/service';
import { startProcessing } from '../../api/processing/service';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorPanel } from '../../components/feedback/ErrorPanel';
import { DocumentPreviewDialog } from '../../components/pdf/DocumentPreviewDialog';
import { useRuntimeConfig } from '../../config/ConfigContext';
import { selectionCounts, toggleContractSelection } from '../../domain/selections';
import type { Contract, DocumentInfo } from '../../domain/models';
import { useWorkflowStore } from '../../state/workflowStore';
import { ContractDocumentTable } from './ContractDocumentTable';
import { ProcessingOverview } from './ProcessingOverview';

export function DocumentsPage() {
  const { t } = useTranslation();
  const { appConfig } = useRuntimeConfig();
  const workflowId = useWorkflowStore((state) => state.workflowId)!;
  const selections = useWorkflowStore((state) => state.selections);
  const setSelections = useWorkflowStore((state) => state.setSelections);
  const selectedContractIds = useWorkflowStore((state) => state.selectedContractIds);
  const setSelectedContractIds = useWorkflowStore((state) => state.setSelectedContractIds);
  const tasks = useWorkflowStore((state) => state.processingTasks);
  const setProcessingTasks = useWorkflowStore((state) => state.setProcessingTasks);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<DocumentInfo>();
  const [confirming, setConfirming] = useState(false);
  const catalog = useQuery({ queryKey: ['contracts', workflowId], queryFn: ({ signal }) => listContracts(appConfig, workflowId, signal) });
  const mutation = useMutation({
    mutationFn: () => startProcessing(appConfig, workflowId, selections),
    onSuccess: (created) => { setProcessingTasks(created); setConfirming(false); },
  });
  const selectedContracts = useMemo(() => (catalog.data ?? []).filter((contract) => selectedContractIds.includes(contract.contractId)), [catalog.data, selectedContractIds]);
  const filtered = useMemo(() => selectedContracts.filter((contract) => `${contract.contractNumber} ${contract.label ?? ''} ${contract.documents.map((document) => document.filename).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [search, selectedContracts]);
  const counts = selectionCounts(selections);

  const setContractDocumentIds = (contractId: string, documentIds: string[]) => {
    const others = selections.filter((selection) => selection.contractId !== contractId);
    setSelections(documentIds.length ? [...others, { contractId, documentIds }] : others);
  };

  const updateSelectedContracts = (contracts: Contract[]) => {
    const currentIds = new Set(selectedContractIds);
    const selectionByContract = new Map(selections.map((selection) => [selection.contractId, selection]));
    setSelectedContractIds(contracts.map((contract) => contract.contractId));
    setSelections(contracts.flatMap((contract) => {
      const existing = selectionByContract.get(contract.contractId);
      if (existing) return [existing];
      if (currentIds.has(contract.contractId) || contract.documents.length === 0) return [];
      return [{ contractId: contract.contractId, documentIds: contract.documents.map((document) => document.documentId) }];
    }));
  };

  return <Stack spacing={3}>
    <Box><Typography variant="h4">{t('documentsTitle')}</Typography><Typography color="text.secondary">{t('documentsSubtitle')}</Typography></Box>
    {catalog.isLoading && <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress /></Stack>}
    {catalog.isError && <ErrorPanel message={catalog.error instanceof Error ? catalog.error.message : t('networkError')} onRetry={() => void catalog.refetch()} />}
    {!catalog.isLoading && !catalog.isError && <Card variant="outlined"><CardContent>
      <Stack spacing={2}>
        <Box><Typography variant="h6">{t('contractsForAnalysis')}</Typography><Typography variant="body2" color="text.secondary">{t('contractSelectorHelp')}</Typography></Box>
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={catalog.data ?? []}
          value={selectedContracts}
          getOptionLabel={(contract) => `${contract.contractNumber}${contract.label ? ` — ${contract.label}` : ''}`}
          isOptionEqualToValue={(option, value) => option.contractId === value.contractId}
          onChange={(_, contracts) => updateSelectedContracts(contracts)}
          renderValue={(contracts, getItemProps) => contracts.map((contract, index) => <Chip label={contract.contractNumber} {...getItemProps({ index })} key={contract.contractId} />)}
          renderInput={(params) => <TextField {...params} label={t('contracts')} placeholder={selectedContracts.length ? undefined : t('selectContracts')} />}
        />
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => updateSelectedContracts(catalog.data ?? [])}>{t('selectAllContracts')}</Button>
          <Button onClick={() => updateSelectedContracts([])} disabled={!selectedContractIds.length}>{t('clearContracts')}</Button>
        </Stack>
      </Stack>
    </CardContent></Card>}
    {!!selectedContractIds.length && <TextField value={search} onChange={(event) => setSearch(event.target.value)} label={t('searchDocuments')} size="small" sx={{ maxWidth: 440 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />}
    {!catalog.isLoading && !catalog.isError && selectedContractIds.length === 0 && <EmptyState message={t('noContractsSelected')} />}
    {!catalog.isLoading && !catalog.isError && selectedContractIds.length > 0 && filtered.length === 0 && <EmptyState message={search ? t('noMatch') : t('noDocuments')} />}
    <Stack spacing={1.5}>{filtered.map((contract) => {
      const selected = selections.find((item) => item.contractId === contract.contractId);
      const selectedCount = selected?.documentIds.length ?? 0;
      const all = contract.documents.length > 0 && selectedCount === contract.documents.length;
      const indeterminate = selectedCount > 0 && !all;
      return <Accordion key={contract.contractId} defaultExpanded={filtered.length <= 3} disableGutters>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Checkbox checked={all} indeterminate={indeterminate} onClick={(event) => event.stopPropagation()} onChange={(_, checked) => setSelections(toggleContractSelection(selections, contract, checked))} slotProps={{ input: { 'aria-label': `${t('contract')} ${contract.contractNumber}` } }} />
          <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 700 }}>{contract.contractNumber} {contract.label && `— ${contract.label}`}</Typography><Typography variant="body2" color="text.secondary">{selectedCount} / {contract.documents.length} {t('stepDocuments').toLowerCase()}</Typography></Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}><ContractDocumentTable contract={contract} selectedIds={selected?.documentIds ?? []} onSelectionChange={(ids) => setContractDocumentIds(contract.contractId, ids)} onPreview={(documentId) => setPreview(contract.documents.find((document) => document.documentId === documentId))} /></AccordionDetails>
      </Accordion>;
    })}</Stack>
    <Card variant="outlined" sx={{ position: 'sticky', bottom: 16, zIndex: 2, p: 2, bgcolor: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Typography sx={{ fontWeight: 700 }}>{t('selectedSummary', counts)}</Typography>
        <Button variant="contained" size="large" disabled={!counts.documents || mutation.isPending || tasks.some((task) => task.status === 'queued' || task.status === 'running')} onClick={() => setConfirming(true)}>{mutation.isPending ? <CircularProgress size={22} color="inherit" /> : t('launchProcessing')}</Button>
      </Stack>
    </Card>
    {mutation.isError && <Alert severity="error">{mutation.error instanceof Error ? mutation.error.message : t('networkError')}</Alert>}
    <ProcessingOverview tasks={tasks} />
    <DocumentPreviewDialog open={!!preview} document={preview} workflowId={workflowId} onClose={() => setPreview(undefined)} />
    <ConfirmDialog open={confirming} title={t('confirmProcessing')} message={t('confirmText')} onCancel={() => setConfirming(false)} onConfirm={() => mutation.mutate()} />
  </Stack>;
}
