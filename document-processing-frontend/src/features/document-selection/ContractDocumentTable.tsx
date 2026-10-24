import { Button, Stack } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Contract } from '../../domain/models';

export function ContractDocumentTable({ contract, selectedIds, onSelectionChange, onPreview }: { contract: Contract; selectedIds: string[]; onSelectionChange: (ids: string[]) => void; onPreview: (documentId: string) => void }) {
  const { t } = useTranslation();
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'filename', headerName: t('filename'), flex: 1, minWidth: 180 },
    { field: 'pageCount', headerName: t('pagesHeader'), width: 90, valueFormatter: (value) => value ?? '—' },
    { field: 'actions', headerName: t('actions'), width: 135, sortable: false, filterable: false, renderCell: (params) => <Button size="small" onClick={() => onPreview(String(params.id))}>{t('view')}</Button> },
  ], [onPreview, t]);
  const model: GridRowSelectionModel = { type: 'include', ids: new Set(selectedIds) };
  const visibleDocumentRows = 5;
  const gridHeight = Math.min(58 + Math.max(contract.documents.length, 1) * 52, 58 + visibleDocumentRows * 52);
  return <Stack sx={{ height: gridHeight, maxHeight: 58 + visibleDocumentRows * 52 }}><DataGrid
    rows={contract.documents} getRowId={(row) => row.documentId} columns={columns} checkboxSelection disableRowSelectionOnClick hideFooter
    rowSelectionModel={model}
    onRowSelectionModelChange={(next) => {
      const ids = next.type === 'exclude'
        ? contract.documents.filter((document) => !next.ids.has(document.documentId)).map((document) => document.documentId)
        : [...next.ids].map(String);
      onSelectionChange(ids);
    }}
    sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#F5F7FA' } }}
  /></Stack>;
}
