import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { DocumentTypeDefinition } from '../../config/schema';

export function DocumentTypeBadge({ definition, code }: { definition?: DocumentTypeDefinition; code: string }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en' : 'fr';
  return <Chip color={definition ? 'primary' : 'warning'} variant="outlined" label={definition?.label[locale] ?? t('unknownType', { code })} />;
}
