import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

// Small enough that the table overflows the screen in both directions, like a narrow phone
const SMALL_SCREEN = { width: 320, height: 360 }

async function box(locator: Locator) {
  const bounds = await locator.boundingBox()
  expect(bounds, 'element is not rendered').not.toBeNull()
  return bounds ?? { x: 0, y: 0, width: 0, height: 0 }
}

async function xOf(locator: Locator): Promise<number> {
  const { x } = await box(locator)
  return x
}

async function yOf(locator: Locator): Promise<number> {
  const { y } = await box(locator)
  return y
}

function tableParts(page: Page) {
  return {
    region: page.getByRole('region', { name: 'Premier Division' }),
    positionHeader: page.getByRole('columnheader', { name: 'Position' }),
    clubHeader: page.getByRole('columnheader', { name: 'Club' }),
    pointsHeader: page.getByRole('columnheader', { name: 'Points' }),
    leaderPosition: page
      .getByRole('row', { name: /Glenhaven City/ })
      .getByRole('cell')
      .first(),
    leaderClub: page.getByRole('rowheader', { name: 'Glenhaven City' }),
  }
}

async function scrollToEnd(region: Locator) {
  await region.evaluate((element) => {
    element.scrollTo({ left: element.scrollWidth })
  })
}

async function scrollToBottom(region: Locator) {
  await region.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight })
  })
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

  test('keeps Position and Club in view while scrolling sideways', async ({ page }) => {
    const parts = tableParts(page)
    const clubX = await xOf(parts.leaderClub)
    const pointsX = await xOf(parts.pointsHeader)

    await scrollToEnd(parts.region)

    // The numbers moved, so the region really scrolled...
    expect(await xOf(parts.pointsHeader)).toBeLessThan(pointsX)
    // ...but the pinned columns stayed where they were
    expect(await xOf(parts.leaderClub)).toBeCloseTo(clubX, 0)
    expect(await xOf(parts.clubHeader)).toBeCloseTo(clubX, 0)
  })

  test('keeps the header row in view while scrolling down', async ({ page }) => {
    const parts = tableParts(page)
    const regionY = await yOf(parts.region)

    await scrollToBottom(parts.region)

    expect(await yOf(parts.clubHeader)).toBeCloseTo(regionY, 0)
    expect(await yOf(parts.pointsHeader)).toBeCloseTo(regionY, 0)
  })

  // Text at 200% (WCAG 1.4.4): the pinned widths are in rem, so they grow with the text
  // and Club still starts where Position ends. The screen is a desktop at 200% zoom
  // (1280 / 2 CSS px), where both pinned columns still fit.
  test('keeps Position and Club apart with the text size doubled', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 360 })
    const parts = tableParts(page)
    await page.locator('html').evaluate((html) => {
      html.style.setProperty('font-size', '200%')
    })
    await scrollToEnd(parts.region)

    const position = await box(parts.leaderPosition)
    const club = await box(parts.leaderClub)
    expect(position.x + position.width).toBeLessThanOrEqual(club.x + 0.5)
  })

  // A transparent sticky cell would show the scrolled content through it
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`gives the pinned cells an opaque background in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      const parts = tableParts(page)

      // rgb(...) has no alpha channel; rgba(...) would let the content through
      for (const cell of [parts.positionHeader, parts.clubHeader, parts.leaderClub]) {
        await expect(cell).toHaveCSS('background-color', /^rgb\(/)
      }
    })
  }
})
