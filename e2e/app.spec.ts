import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('app', () => {
  test('shows the app name as the main heading', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Pitchside' })).toBeVisible()
  })

  // Also catches Content-Security-Policy violations, which the browser reports as console errors
  test('loads without console or page errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text())
      }
    })
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(errors).toStrictEqual([])
  })

  // Runs in a real browser, so unlike the jsdom tests this also checks color contrast
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no accessibility violations in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto('/')

      const results = await new AxeBuilder({ page }).analyze()

      expect(results.violations).toStrictEqual([])
    })
  }
})
