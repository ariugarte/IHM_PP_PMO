import { Download, NavigateBefore, NavigateNext, ZoomIn, ZoomOut } from '@mui/icons-material';
import { Alert, Box, CircularProgress, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { getPdfBlob } from '../../api/documents/service';
import { useRuntimeConfig } from '../../config/ConfigContext';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export function PdfViewer({ workflowId, documentId, filename, pageNumber, onPageChange }: { workflowId: string; documentId: string; filename: string; pageNumber?: number; onPageChange?: (page: number) => void }) {
  const { t } = useTranslation();
  const { appConfig } = useRuntimeConfig();
  const [numPages, setNumPages] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const [scale, setScale] = useState(1);
  const currentPage = pageNumber ?? internalPage;
  const query = useQuery({ queryKey: ['pdf', workflowId, documentId], queryFn: ({ signal }) => getPdfBlob(appConfig, workflowId, documentId, signal), staleTime: 60_000 });

  useEffect(() => { if (numPages && currentPage > numPages) (onPageChange ?? setInternalPage)(numPages); }, [currentPage, numPages, onPageChange]);
  const setPage = (page: number) => (onPageChange ?? setInternalPage)(Math.min(Math.max(page, 1), numPages || 1));
  const download = () => {
    if (!query.data) return;
    const url = URL.createObjectURL(query.data);
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  if (query.isLoading) return <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}><CircularProgress /><Typography>{t('loadingPdf')}</Typography></Stack>;
  if (query.isError || !query.data) return <Alert severity="error">{t('pdfError')} {query.error instanceof Error ? query.error.message : ''}</Alert>;
  return <Stack spacing={1.5} sx={{ minWidth: 0 }}>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
      <Tooltip title={t('previousPage')}><span><IconButton aria-label={t('previousPage')} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><NavigateBefore /></IconButton></span></Tooltip>
      <Typography sx={{ minWidth: 100, textAlign: 'center' }}>{t('page', { current: currentPage, total: numPages || '…' })}</Typography>
      <Tooltip title={t('nextPage')}><span><IconButton aria-label={t('nextPage')} disabled={!numPages || currentPage >= numPages} onClick={() => setPage(currentPage + 1)}><NavigateNext /></IconButton></span></Tooltip>
      <Tooltip title={t('zoomOut')}><span><IconButton aria-label={t('zoomOut')} disabled={scale <= 0.6} onClick={() => setScale((value) => Math.max(0.6, value - 0.2))}><ZoomOut /></IconButton></span></Tooltip>
      <Typography variant="body2">{Math.round(scale * 100)} %</Typography>
      <Tooltip title={t('zoomIn')}><IconButton aria-label={t('zoomIn')} onClick={() => setScale((value) => Math.min(2, value + 0.2))}><ZoomIn /></IconButton></Tooltip>
      <Tooltip title={t('download')}><IconButton aria-label={t('download')} onClick={download}><Download /></IconButton></Tooltip>
    </Stack>
    <Box data-testid="pdf-viewer" sx={{ overflow: 'auto', bgcolor: '#E7ECF2', borderRadius: 2, p: 2, minHeight: 420, '& .react-pdf__Page': { mx: 'auto', width: 'fit-content', boxShadow: 2 } }}>
      <Document file={query.data} loading={<CircularProgress />} error={<Alert severity="error">{t('pdfError')}</Alert>} onLoadSuccess={({ numPages: total }) => setNumPages(total)}>
        <Page pageNumber={currentPage} scale={scale} renderAnnotationLayer renderTextLayer />
      </Document>
    </Box>
  </Stack>;
}
