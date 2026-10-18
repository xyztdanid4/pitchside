import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

// Small enough that the table overflows the screen in both directions, like a narrow phone
const SMALL_SCREEN = { width: 320, height: 360 }

function tableParts(page: Page) {
  return {
    region: page.getByRole('region', { name: 'Premier Division' }),
  }
}

test.describe('standings table', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(SMALL_SCREEN)
    await page.goto('/')
  })

  // Only the table scrolls sideways: content that escaped its region (e.g. absolutely
  // positioned labels) would make the whole page scroll
  test('does not make the page scroll sideways', async ({ page }) => {
    await expect(tableParts(page).region).toBeVisible()

    const overflow = await page
      .locator('html')
      .evaluate((html) => html.scrollWidth - html.clientWidth)
    expect(overflow).toBe(0)
  })

  // One scroll area: the page is exactly the screen's height and only the table scrolls,
  // so a phone never has a scroll area inside a scrolling page
  test('scrolls only the table, not the page', async ({ page }) => {
    const { region } = tableParts(page)
    await expect(region).toBeVisible()

    const pageOverflow = await page
      .locator('html')
      .evaluate((html) => html.scrollHeight - html.clientHeight)
    const regionOverflow = await region.evaluate(
      (element) => element.scrollHeight - element.clientHeight,
    )
    expect(pageOverflow).toBe(0)
    // The table doesn't fit this screen, so the region is what scrolls
    expect(regionOverflow).toBeGreaterThan(0)
  })

  // The region takes focus, so keyboard users can scroll the table too (WCAG 2.1.1)
  test('scrolls the table with the keyboard', async ({ page }) => {
    const { region } = tableParts(page)
    // The table arrives over fetch; until then there is nothing to focus
    await expect(region).toBeVisible()

    await page.keyboard.press('Tab')
    await expect(region).toBeFocused()
    await page.keyboard.press('ArrowRight')

    // Keyboard scrolling is animated, so wait for it
    await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  })
})
