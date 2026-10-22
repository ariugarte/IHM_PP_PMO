import { Description, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Alert, Box, Card, CardContent, Chip, Collapse, Divider, Grid, List, ListItemButton, ListItemIcon, ListItemText, Skeleton, Stack, Typography } from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listContracts } from '../../api/contracts/service';
import { getTaskResults } from '../../api/processing/service';
import { PdfViewer } from '../../components/pdf/PdfViewer';
import { StatusChip } from '../../components/feedback/StatusChip';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useRuntimeConfig } from '../../config/ConfigContext';
import type { Contract, DocumentInfo, DocumentResult, Task, TaskStatus } from '../../domain/models';
import { useWorkflowStore } from '../../state/workflowStore';
import { ChatPanel } from '../contextual-chat/ChatPanel';
import { PageClassificationPanel } from './PageClassificationPanel';

function taskForDocument(tasks: Task[], documentId: string) { return tasks.find((task) => task.documentIds?.includes(documentId)); }

function ResultNavigation({ contracts, tasks, selectedDocumentId, onSelect }: { contracts: Contract[]; tasks: Task[]; selectedDocumentId?: string; onSelect: (contractId: string, documentId: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(contracts.map((contract) => [contract.contractId, true])));
  const involvedIds = useMemo(() => new Set(tasks.flatMap((task) => task.documentIds ?? [])), [tasks]);
  return <List disablePadding>{contracts.map((contract) => {
    const documents = contract.documents.filter((document) => involvedIds.has(document.documentId));
    if (!documents.length) return null;
    return <Box key={contract.contractId}><ListItemButton onClick={() => setOpen((current) => ({ ...current, [contract.contractId]: !current[contract.contractId] }))}><ListItemText primary={contract.contractNumber} secondary={contract.label} slotProps={{ primary: { sx: { fontWeight: 700 } } }} />{open[contract.contractId] ? <ExpandLess /> : <ExpandMore />}</ListItemButton><Collapse in={open[contract.contractId]}><List component="div" disablePadding>{documents.map((document) => {
      const task = taskForDocument(tasks, document.documentId);
      return <ListItemButton key={document.documentId} selected={selectedDocumentId === document.documentId} onClick={() => onSelect(contract.contractId, document.documentId)} sx={{ pl: 3 }}><ListItemIcon sx={{ minWidth: 36 }}><Description fontSize="small" /></ListItemIcon><ListItemText primary={document.filename} secondary={task?.status ? <StatusChip status={task.status} /> : undefined} /></ListItemButton>;
    })}</List></Collapse><Divider /></Box>;
  })}</List>;
}

function summary(tasks: Task[]): Record<TaskStatus, number> {
  return tasks.reduce<Record<TaskStatus, number>>((counts, task) => ({ ...counts, [task.status]: counts[task.status] + 1 }), { queued: 0, running: 0, succeeded: 0, failed: 0, cancelled: 0 });
}

export function ResultsPage() {
  const { t } = useTranslation();
  const { appConfig } = useRuntimeConfig();
  const workflowId = useWorkflowStore((state) => state.workflowId)!;
  const tasks = useWorkflowStore((state) => state.processingTasks);
  const selectedContractId = useWorkflowStore((state) => state.selectedContractId);
  const selectedDocumentId = useWorkflowStore((state) => state.selectedDocumentId);
  const selectedPage = useWorkflowStore((state) => state.selectedPage);
  const selectResult = useWorkflowStore((state) => state.selectResult);
  const setSelectedPage = useWorkflowStore((state) => state.setSelectedPage);
  const catalog = useQuery({ queryKey: ['contracts', workflowId], queryFn: ({ signal }) => listContracts(appConfig, workflowId, signal) });
  const succeededTasks = tasks.filter((task) => task.status === 'succeeded');
  const resultQueries = useQueries({ queries: succeededTasks.map((task) => ({ queryKey: ['task-results', task.taskId], queryFn: ({ signal }: { signal: AbortSignal }) => getTaskResults(appConfig, task.taskId, signal), staleTime: 30_000 })) });
  const results = useMemo(() => {
    const byDocument = new Map<string, DocumentResult>();
    resultQueries.forEach((query) => query.data?.forEach((result) => byDocument.set(result.documentId, result)));
    return [...byDocument.values()];
  }, [resultQueries]);
  const allDocuments = useMemo(() => (catalog.data ?? []).flatMap((contract) => contract.documents), [catalog.data]);
  const selectedDocument: DocumentInfo | undefined = allDocuments.find((document) => document.documentId === selectedDocumentId);
  const selectedResult = results.find((result) => result.documentId === selectedDocumentId);
  const page = selectedResult?.pages.find((item) => item.pageNumber === selectedPage && (!selectedDocument?.pageCount || item.pageNumber <= selectedDocument.pageCount));
  const selectedTask = selectedDocumentId ? taskForDocument(tasks, selectedDocumentId) : undefined;
  const counts = summary(tasks);

  useEffect(() => {
    if (selectedDocumentId || !catalog.data?.length) return;
    const firstTask = tasks.find((task) => task.documentIds?.length);
    const firstDocumentId = firstTask?.documentIds?.[0];
    if (firstTask?.contractId && firstDocumentId) selectResult(firstTask.contractId, firstDocumentId, 1);
  }, [catalog.data, selectResult, selectedDocumentId, tasks]);

  const navigateToSource = (documentId: string, pageNumber: number) => {
    const document = allDocuments.find((item) => item.documentId === documentId);
    if (document) selectResult(document.contractId, documentId, pageNumber);
  };

  if (catalog.isLoading) return <Stack spacing={2}><Skeleton height={64} /><Skeleton height={500} /></Stack>;
  return <Stack spacing={3}>
    <Box><Typography variant="h4">{t('resultsTitle')}</Typography><Typography color="text.secondary">{t('resultsSubtitle')}</Typography></Box>
    <Card><CardContent><Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}><Typography sx={{ fontWeight: 700, mr: 1 }}>{t('taskOverview')}</Typography>{(Object.keys(counts) as TaskStatus[]).map((status) => <Chip key={status} color={status === 'failed' ? 'error' : status === 'succeeded' ? 'success' : 'default'} variant={counts[status] ? 'filled' : 'outlined'} label={`${t(status)} · ${counts[status]}`} />)}</Stack></CardContent></Card>
    {(counts.failed > 0 || counts.cancelled > 0) && counts.succeeded > 0 && <Alert severity="warning">{t('partialWarning')}</Alert>}
    <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
      <Grid size={{ xs: 12, md: 3 }}><Card sx={{ height: '100%' }}><ResultNavigation contracts={catalog.data ?? []} tasks={tasks} selectedDocumentId={selectedDocumentId} onSelect={selectResult} /></Card></Grid>
      <Grid size={{ xs: 12, md: 5 }}>{selectedDocument ? <PdfViewer workflowId={workflowId} documentId={selectedDocument.documentId} filename={selectedDocument.filename} pageNumber={selectedPage} onPageChange={setSelectedPage} /> : <EmptyState message={t('emptyResults')} />}</Grid>
      <Grid size={{ xs: 12, md: 4 }}><Stack spacing={2}><Card><CardContent>{page ? <PageClassificationPanel page={page} totalPages={selectedDocument?.pageCount ?? selectedResult?.pages.length} /> : selectedTask ? <Stack spacing={1}><StatusChip status={selectedTask.status} /><Typography color="text.secondary">{selectedTask.status === 'failed' ? selectedTask.message : t('processing')}</Typography></Stack> : <EmptyState message={t('emptyResults')} />}</CardContent></Card>
        {appConfig.features.chatEnabled && selectedDocumentId && selectedContractId && <ChatPanel context={{ workflowId, contractIds: [selectedContractId], documentIds: [selectedDocumentId], pageNumbers: [selectedPage] }} onNavigate={navigateToSource} />}
      </Stack></Grid>
    </Grid>
  </Stack>;
}
