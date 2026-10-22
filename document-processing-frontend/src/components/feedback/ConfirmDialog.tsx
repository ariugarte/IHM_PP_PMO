import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function ConfirmDialog({ open, title, message, onCancel, onConfirm }: { open: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return <Dialog open={open} onClose={onCancel} aria-labelledby="confirm-title">
    <DialogTitle id="confirm-title">{title}</DialogTitle>
    <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
    <DialogActions><Button onClick={onCancel}>{t('cancel')}</Button><Button variant="contained" onClick={onConfirm} autoFocus>{t('confirm')}</Button></DialogActions>
  </Dialog>;
}
