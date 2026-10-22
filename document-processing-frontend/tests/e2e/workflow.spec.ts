import { expect, test, type Page } from '@playwright/test';

async function startFilesystemIntake(page: Page) {
  await page.goto('/source');
  await page.getByLabel('Chemin du dossier').fill('/data/contracts/2026');
  await page.getByRole('button', { name: "Démarrer l’analyse" }).click();
}

async function continueAfterIntake(page: Page) {
  await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page).toHaveURL(/\/documents$/);
}

async function mockScenario(page: Page, scenario: 'partial-failure' | 'intake-failure' | 'slow-processing') {
  await page.route('**/config/app-config.json', async (route) => {
    const response = await route.fetch();
    const config = await response.json();
    config.mock.scenario = scenario;
    await route.fulfill({ response, json: config });
  });
}

test('GED intake, exact refined selection, PDF preview and progressive page results', async ({ page }) => {
  await page.goto('/source');
  await page.getByRole('radio', { name: 'GED' }).check();
  const contracts = page.getByLabel('Contrats');
  await contracts.click();
  await page.getByRole('option', { name: /CTR-2026-001/ }).click();
  await page.getByRole('button', { name: "Démarrer l’analyse" }).click();
  await continueAfterIntake(page);

  await page.getByRole('checkbox', { name: 'Contrat CTR-2026-001' }).check();
  const identityRow = page.getByRole('row').filter({ hasText: 'identite_alice.pdf' });
  await identityRow.getByRole('checkbox').uncheck();

  await page.getByRole('row').filter({ hasText: 'kbis_alpha.pdf' }).getByRole('button', { name: 'Visualiser' }).click();
  await expect(page.getByTestId('pdf-viewer').locator('canvas')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Fermer' }).click();

  const requestPromise = page.waitForRequest((request) => request.method() === 'POST' && request.url().includes('/processing-jobs'));
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ workflowId: 'WF-001', selections: [{ contractId: 'C-001', documentIds: ['D-001'] }] });

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
  await startFilesystemIntake(page);
  await continueAfterIntake(page);
  await page.getByRole('checkbox', { name: 'Contrat CTR-2026-001' }).check();
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByText(/TASK-1-001/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/TASK-1-001/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voir les résultats' })).toBeVisible({ timeout: 15_000 });
});

test('intake failure never unlocks documents and can be retried', async ({ page }) => {
  await mockScenario(page, 'intake-failure');
  await startFilesystemIntake(page);
  await expect(page.getByText('La source GED a refusé la collecte simulée.').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Continuer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: "Démarrer l’analyse" })).toBeEnabled();
});

test('partial processing failure keeps completed results usable', async ({ page }) => {
  await mockScenario(page, 'partial-failure');
  await startFilesystemIntake(page);
  await continueAfterIntake(page);
  await expect(page.getByText('kbis_alpha.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Tout sélectionner' }).click();
  await page.getByRole('button', { name: 'Lancer le traitement' }).click();
  await page.getByRole('button', { name: 'Confirmer' }).click();
  await expect(page.getByRole('button', { name: 'Voir les résultats' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Voir les résultats' }).click();
  await expect(page.getByText('Des traitements ont échoué. Les résultats disponibles restent consultables.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Extrait Kbis')).toBeVisible();
  await page.getByText('annexe_inconnue.pdf').click();
  await expect(page.getByText('Type inconnu (NOTICE_LEGACY)')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('ZX-908', { exact: true })).toBeVisible();
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
