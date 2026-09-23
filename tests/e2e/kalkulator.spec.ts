import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.describe('GUI kalkulatora harmonogramu', () => {
  test('wyświetla formularz parametrów kredytu', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('rata.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Kwota kredytu' })).toHaveValue('400000');
    await expect(page.getByLabel('Liczba rat')).toHaveValue('300');
    await expect(page.getByLabel('Pierwsza rata')).toHaveValue('2026-10-01');
    await expect(page.getByRole('radio', { name: 'POLSTR 1M' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Równe' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Policz' })).toBeVisible();
  });

  test('oblicza harmonogram dla liczby kontrolnej', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Policz' }).click();

    await expect(page.getByText('Pierwsza rata')).toBeVisible();
    await expect(page.locator('.hero-kwota')).toContainText('2495,85');
    await expect(page.getByText('Harmonogram', { exact: true })).toBeVisible();
    await expect(page.getByText('300 rat')).toBeVisible();
    await expect(page.getByRole('button', { name: /^2026/ })).toBeVisible();
  });

  test('przełącza na raty malejące i odświeża wynik', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Kwota kredytu' }).fill('100000');
    await page.getByLabel('Liczba rat').fill('12');
    await page.getByRole('radio', { name: 'Malejące' }).check();
    await page.getByRole('button', { name: 'Policz' }).click();

    await expect(page.locator('.hero-kwota')).toContainText('9');
    await expect(page.getByText('12 rat')).toBeVisible();
  });

  test('otwiera modal i pozwala dodać nadpłatę', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dodaj' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '＋ Dodaj' }).click();
    await dialog.getByLabel('Po racie').fill('12');
    await dialog.getByLabel('Kwota').fill('5000');
    await dialog.getByLabel('Efekt').selectOption('obniz_rate');
    await dialog.getByRole('button', { name: 'Gotowe' }).click();

    await expect(page.getByText('1 zaplanowane')).toBeVisible();
  });

  test('waliduje pustą kwotę kredytu przed przeliczeniem', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Kwota kredytu' }).fill('');
    await page.getByRole('button', { name: 'Policz' }).click();

    await expect(page.locator('.blad-v4')).toHaveText('Podaj kwote kredytu');
    await expect(page.locator('.hero-kwota')).toHaveText('— ');
  });

  test('waliduje niepełną nadpłatę przed przeliczeniem', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dodaj' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: '＋ Dodaj' }).click();
    await dialog.getByLabel('Kwota').fill('5000');
    await dialog.getByRole('button', { name: 'Gotowe' }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.blad-v4')).toHaveText('Podaj po ktorej racie ma byc nadplata');
  });

  test('pobiera harmonogram jako plik CSV', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Liczba rat').fill('12');
    await page.getByRole('button', { name: 'Policz' }).click();
    await expect(page.getByText('Harmonogram', { exact: true })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '↓ CSV' }).click();
    const download = await downloadPromise;
    const sciezka = await download.path();

    expect(download.suggestedFilename()).toBe('harmonogram.csv');
    expect(sciezka).not.toBeNull();
    const zawartosc = await readFile(sciezka ?? '', 'utf8');
    expect(zawartosc).toContain('Rata (PLN)');
    expect(zawartosc).toContain('zł');
  });
});
