import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { DocumentInfo } from '../../domain/models';
import { PdfViewer } from './PdfViewer';

export function DocumentPreviewDialog({ open, document, workflowId, onClose }: { open: boolean; document?: DocumentInfo; workflowId: string; onClose: () => void }) {
  const { t } = useTranslation();
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
    <DialogTitle>{document?.filename}<IconButton aria-label={t('close')} onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton></DialogTitle>
    <DialogContent dividers>{document && <PdfViewer workflowId={workflowId} documentId={document.documentId} filename={document.filename} />}</DialogContent>
  </Dialog>;
}
