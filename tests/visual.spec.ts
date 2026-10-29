import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const SHOTS = "test-results/screens";
fs.mkdirSync(SHOTS, { recursive: true });

async function scrollFilm(page: Page, p: number) {
  await page.evaluate((p) => {
    const s = document.getElementById("film")!;
    window.scrollTo(0, Math.round(s.offsetTop + p * (s.offsetHeight - innerHeight)));
  }, p);
  await page.waitForTimeout(1400);
}

test.describe("film", () => {
  test("plays at 7 scroll points with one headline at a time and no console errors", async ({ page }, info) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("DIRTY.");
    for (const p of [0, 0.05, 0.2, 0.4, 0.6, 0.8, 1]) {
      await scrollFilm(page, p);
      const visible = await page.locator(".film-ch-wrap").evaluateAll((els) => els.filter((e) => getComputedStyle(e).visibility === "visible").length);
      expect(visible, `headlines visible at ${p}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `${SHOTS}/${info.project.name}-film-${String(p).replace(".", "_")}.png` });
    }
    expect(errors).toEqual([]);
  });

  test("reduced motion gets the stacked static film", async ({ browser }, info) => {
    const ctx = await browser.newContext({ ...info.project.use, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    const h = await page.locator("#film").evaluate((e) => e.getBoundingClientRect().height);
    const vh = await page.evaluate(() => innerHeight);
    expect(Math.round(h / vh)).toBe(5); // five stacked full-height chapters, no 700vh pin
    await expect(page.locator(".film-canvas")).toBeHidden();
    await ctx.close();
  });
});

test.describe("booking", () => {
  test("keyboard-only booking reaches the success state", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "keyboard pass runs on desktop");
    await page.goto("/");
    await page.getByRole("button", { name: /BOOK A DETAIL/ }).first().focus();
    await page.keyboard.press("Enter");
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible();
    // focus starts on the first car tile; the tiles are a radio group, so arrows move the choice
    await expect(dlg.getByRole("radio", { name: "SUV" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(dlg.getByRole("radio", { name: "Sedan" })).toHaveAttribute("aria-checked", "true");
    await dlg.getByRole("radio", { name: /^Wash/ }).focus();
    await page.keyboard.press("Space");
    await dlg.getByRole("radiogroup", { name: "Day" }).locator("button:not([disabled])").last().focus();
    await page.keyboard.press("Enter");
    await dlg.getByRole("radiogroup", { name: "Time" }).locator("button:not([disabled])").last().focus();
    await page.keyboard.press("Enter");
    await dlg.getByLabel("Name").first().focus();
    await page.keyboard.type("Keyboard Kim");
    await page.keyboard.press("Tab");
    await page.keyboard.type("3015550142");
    await dlg.getByRole("button", { name: /CONFIRM BOOKING/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("YOU'RE BOOKED,")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("KEYBOARD.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/admin/login"]) {
    test(`axe: no serious or critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(800);
      const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target}`)).toEqual([]);
    });
  }
});

test("admin is unreachable without an owner login", async ({ page, request }) => {
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await request.get("/api/admin/leads")).status()).toBe(401);
});
