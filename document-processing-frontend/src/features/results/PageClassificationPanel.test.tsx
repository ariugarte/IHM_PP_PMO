import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ConfigProvider } from '../../config/ConfigContext';
import { initializeI18n } from '../../i18n';
import { testConfig, testRegistry } from '../../test/fixtures';
import { PageClassificationPanel } from './PageClassificationPanel';

beforeAll(() => initializeI18n('fr'));

describe('PageClassificationPanel', () => {
  it('renders only the selected page fields and configured missing values', () => {
    render(<ConfigProvider value={{ appConfig: testConfig, documentTypes: testRegistry }}><PageClassificationPanel page={{ pageNumber: 2, documentTypeCode: 'KBIS', fields: [{ key: 'siren', value: '987', sourcePage: 2 }] }} /></ConfigProvider>);
    expect(screen.getByText('987')).toBeInTheDocument();
    expect(screen.getByText('Non renseigné')).toBeInTheDocument();
  });

  it('renders unknown document types and extra keys safely', () => {
    render(<ConfigProvider value={{ appConfig: testConfig, documentTypes: testRegistry }}><PageClassificationPanel page={{ pageNumber: 1, documentTypeCode: 'FUTURE_TYPE', fields: [{ key: 'futureKey', value: '<script>alert(1)</script>' }] }} /></ConfigProvider>);
    expect(screen.getByText('Type inconnu (FUTURE_TYPE)')).toBeInTheDocument();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
});
