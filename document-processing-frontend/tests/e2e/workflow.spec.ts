import { expect, test, type Page } from '@playwright/test';

async function startClientIntake(page: Page, clientType: 'PMO' | 'PP' = 'PMO') {
  await page.goto('/source');
  await page.getByRole('radio', { name: clientType === 'PMO' ? /Personne morale/ : /Personne physique/ }).check();
  await page.getByRole('button', { name: "Démarrer l’analyse" }).click();
  await expect(page).toHaveURL(/\/documents$/);
}

async function addContract(page: Page, contractNumber: string) {
  await page.getByRole('combobox', { name: 'Contrats' }).click();
  await page.getByRole('option', { name: new RegExp(contractNumber) }).click();
  await page.keyboard.press('Escape');
}

async function mockScenario(page: Page, scenario: 'partial-failure' | 'slow-processing') {
  await page.route('**/config/app-config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.mock.scenario = scenario;
    await route.fulfill({ response, json: config });
  });
}

test('PMO intake, contract selector, refined documents, PDF preview and progressive results', async ({ page }) => {
  await startClientIntake(page);
  await addContract(page, 'CTR-2026-001');
  const identityRow = page.getByRole('row').filter({ hasText: 'identity-alice.pdf' });
  await identityRow.getByRole('checkbox').uncheck();

  await page.getByRole('row').filter({ hasText: 'kbis-alpha.pdf' }).getByRole('button', { name: 'Visualiser' }).click();
  await expect(page.getByTestId('pdf-viewer').locator('canvas')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Fermer' }).click();

  const requestPromise = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/processing-jobs'));
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  const request = await requestPromise;
  const payload = request.postDataJSON() as { workflowId: string; selections: Array<{ contractId: string; documentIds: string[] }> };
  expect(payload.workflowId).toBe('FS-PMO');
  expect(payload.selections).toHaveLength(1);
  expect(payload.selections[0]?.documentIds).toHaveLength(1);

  await expect(page.getByRole('button', { name: 'Voir les résultats' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Voir les résultats' }).click();
  await expect(page.getByText('Extrait Kbis')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('123456789')).toBeVisible();
  await page.getByRole('button', { name: 'Page suivante' }).click();
  await expect(page.getByText('Autre / Inconnu')).toBeVisible();
  await expect(page.getByText('Conseil en systèmes informatiques')).toBeVisible();
  await page.getByLabel('Posez une question sur cette page…').fill('Quel est le SIREN ?');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByText('Le numéro SIREN détecté est 123 456 789.')).toBeVisible();
});

test('active processing recovers after a full reload', async ({ page }) => {
  await mockScenario(page, 'slow-processing');
  await startClientIntake(page);
  await addContract(page, 'CTR-2026-001');
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByText(/TASK-1-001/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/TASK-1-001/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voir les résultats' })).toBeVisible({ timeout: 15_000 });
});

test('PP intake sends only the client type and lets the backend choose the folder', async ({ page }) => {
  await page.goto('/source');
  await page.getByRole('radio', { name: /Personne physique/ }).check();
  const requestPromise = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/v1/intakes'));
  await page.getByRole('button', { name: "Démarrer l’analyse" }).click();
  expect((await requestPromise).postDataJSON()).toEqual({ clientType: 'PP' });
  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByText('Contrats à ajouter à l’analyse')).toBeVisible();
});

test('partial processing failure keeps completed results usable', async ({ page }) => {
  await mockScenario(page, 'partial-failure');
  await startClientIntake(page);
  await page.getByRole('button', { name: 'Ajouter tous les contrats' }).click();
  await expect(page.getByText('kbis-alpha.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByRole('button', { name: 'Voir les résultats' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Voir les résultats' }).click();
  await expect(page.getByText('Des traitements ont échoué. Les résultats disponibles restent consultables.')).toBeVisible({ timeout: 15_000 });
  await page.getByText('kbis-alpha.pdf').click();
  await expect(page.getByText('Extrait Kbis')).toBeVisible();
  await page.getByText('unknown-notice.pdf').click();
  await expect(page.getByText('Type inconnu (NOTICE_LEGACY)')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('ZX-908', { exact: true })).toBeVisible();
});

test('client intake lists backend contracts and previews backend PDF bytes', async ({ page }) => {
  await startClientIntake(page, 'PP');
  await addContract(page, 'CTR-2026-001');
  await expect(page.getByText('CTR-2026-001').first()).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'kbis-alpha.pdf' });
  await row.getByRole('button', { name: 'Visualiser' }).click();
  await expect(page.getByTestId('pdf-viewer').locator('canvas')).toBeVisible({ timeout: 10_000 });
});

test('invalid runtime configuration blocks startup visibly', async ({ page }) => {
  await page.route('**/config/app-config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.backends.source.basePath = 'https://private.example/api';
    await route.fulfill({ response, json: config });
  });
  await page.goto('/source');
  await expect(page.getByRole('heading', { name: 'Configuration invalide' })).toBeVisible();
  await expect(page.getByText('Aucun mode simulé n’a été activé automatiquement.')).toBeVisible();
});
