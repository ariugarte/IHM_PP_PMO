import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { ConfigurationErrorScreen } from './app/ConfigurationErrorScreen';
import { ConfigProvider } from './config/ConfigContext';
import { loadRuntimeConfiguration, type ConfigurationError } from './config/load';
import { initializeI18n } from './i18n';
import { appTheme } from './theme/theme';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Élément #root manquant');
const root = createRoot(rootElement);

async function bootstrap() {
  try {
    const runtime = await loadRuntimeConfiguration();
    await initializeI18n(runtime.appConfig.app.defaultLocale);
    if (runtime.appConfig.mock.enabled) {
      const { createMockWorker } = await import('./mocks/browser');
      const worker = createMockWorker(runtime.appConfig.mock.scenario);
      await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } });
    }
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: false, refetchOnWindowFocus: false } } });
    root.render(<StrictMode><ConfigProvider value={runtime}><ThemeProvider theme={appTheme}><CssBaseline /><QueryClientProvider client={queryClient}><App /></QueryClientProvider></ThemeProvider></ConfigProvider></StrictMode>);
  } catch (error) {
    root.render(<ThemeProvider theme={appTheme}><CssBaseline /><ConfigurationErrorScreen error={error as ConfigurationError} /></ThemeProvider>);
  }
}

void bootstrap();
