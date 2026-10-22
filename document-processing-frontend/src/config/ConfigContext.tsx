/* eslint-disable react-refresh/only-export-components -- the provider and its typed consumer belong to one context module */
import { createContext, useContext, type ReactNode } from 'react';
import type { AppConfig, DocumentTypeRegistry } from './schema';

type RuntimeConfig = { appConfig: AppConfig; documentTypes: DocumentTypeRegistry };
const ConfigContext = createContext<RuntimeConfig | null>(null);

export function ConfigProvider({ value, children }: { value: RuntimeConfig; children: ReactNode }) {
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useRuntimeConfig(): RuntimeConfig {
  const value = useContext(ConfigContext);
  if (!value) throw new Error('ConfigProvider manquant');
  return value;
}
