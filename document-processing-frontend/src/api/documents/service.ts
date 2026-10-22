import type { AppConfig } from '../../config/schema';
import { httpClient } from '../http';
import { endpoint } from '../routes';

export async function getPdfBlob(config: AppConfig, workflowId: string, documentId: string, signal?: AbortSignal): Promise<Blob> {
  const { url } = endpoint(config, 'catalog', 'getPdf', { workflowId, documentId });
  const blob = await httpClient.blob(url, { signal });
  if (blob.type && blob.type !== 'application/pdf') throw new Error('Le service n’a pas retourné un PDF');
  return blob;
}
