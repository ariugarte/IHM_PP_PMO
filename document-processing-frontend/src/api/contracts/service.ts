import type { AppConfig } from '../../config/schema';
import type { Contract } from '../../domain/models';
import { httpClient } from '../http';
import { endpoint } from '../routes';
import { adaptCatalog } from './adapters';

export async function listContracts(config: AppConfig, workflowId: string, signal?: AbortSignal): Promise<Contract[]> {
  const { url } = endpoint(config, 'catalog', 'listContractsWithDocuments', { workflowId });
  return adaptCatalog(await httpClient.json(url, { signal }));
}
