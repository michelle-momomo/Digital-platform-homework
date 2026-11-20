import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function create(page: Page, name: string) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Digital Platforms · Guest Sessions" })).toBeVisible();
  await expect(page.getByText("Vibe Coding · LaunchLab · 9 Oct")).toBeVisible();
  await expect(page.getByText("Agentic AI · Nick Goh · 30 Oct")).toBeVisible();
  await expect(page.getByText("LinkedIn · Cindy Leong · 13 Nov")).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("button", { name: "Boy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Spiky", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pigtails", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Girl", exact: true }).click();
  await page.getByRole("button", { name: "Pigtails", exact: true }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Start adventure" }).click();
}

async function sortPipeline(page: Page) {
  const order = [
    "Design the interface",
    "Build the working site",
    "Commit and push to GitHub",
    "Deploy with Vercel",
  ];
  for (let to = 0; to < order.length; to++) {
    let from = await page.locator(".stack b").allTextContents().then((items) => items.indexOf(order[to]));
    while (from > to) {
      await page.getByRole("button", { name: `Move ${order[to]} up`, exact: true }).click();
      from--;
    }
  }
}

test("create a pal, walk the map, and clear the first level", async ({ page }) => {
  await create(page, "Mina");
  await expect(page.getByRole("heading", { name: "World map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Vibe Coding/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Agentic AI/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /LinkedIn/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Coming soon/ }).first()).toBeDisabled();
  await page.getByRole("button", { name: /Vibe Coding/ }).click();
  await expect(page.getByRole("heading", { name: "Vibe Coding" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Who does this job/ })).toBeDisabled();
  await page.getByRole("button", { name: /Sketch, then ship/ }).click();
  await expect(page.getByText("An idea wants to become a live site.")).toBeVisible();
  await page.getByRole("button", { name: "Check order" }).click();
  await sortPipeline(page);
  await page.getByRole("button", { name: "Check order" }).click();
  await expect(page.getByText("Design the look, build it, push the code, then connect hosting.")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Vibe Coding" })).toBeVisible();
  await expect(page.locator(".stars .on").first()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
});

test("a saved pal continues from the cover", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "dp-quest-v1",
      JSON.stringify({
        character: {
          name: "Mina",
          studentId: "",
          gender: "girl",
          hair: "pigtails",
          hairColor: "#C5B3F5",
          skin: "#F6C8A4",
          outfit: "#F8C8DC",
        },
        mute: true,
        here: "vibe",
        levels: {},
        logs: [],
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "World map" })).toBeVisible();
  await page.getByRole("button", { name: "Cover", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Digital Platforms · Guest Sessions" })).toBeVisible();
  await page.getByRole("button", { name: "New character", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start adventure" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("admin explains a missing backend", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("The results backend is not configured.")).toBeVisible();
});
