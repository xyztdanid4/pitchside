import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('app', () => {
  test('shows the app name as the main heading', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Pitchside' })).toBeVisible()
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
