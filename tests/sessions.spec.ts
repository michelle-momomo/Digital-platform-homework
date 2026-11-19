import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const seats = [
  "Brief Writer",
  "Brief Validator",
  "Strategist",
  "You",
  "Designer + Copywriter",
  "Reviewer",
];

async function openSession(page: Page, name: string) {
  await page.getByRole("tab", { name }).click();
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test("agentic handoff and linkedin showdown are playable", async ({ page }) => {
  await page.goto("/");
  await openSession(page, "Agentic AI");
  await expect(page.getByText("Nick Goh · 30 Oct 2026")).toBeVisible();
  await expect(page.getByText(/CEO, INSPIRO Consulting/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Six seats, and you are seat four" }),
  ).toBeVisible();
  await expect(page.getByText("Nick Goh deck pp. 4, 5, 6").first()).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Start challenge" }).click();
  await expect(
    page.getByRole("heading", { name: "Who works this seat?" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: /^The Buyer/ }).click();
  await expect(page.getByText("↻ Not this seat.")).toBeVisible();
  for (const seat of seats) {
    await page
      .getByRole("button", { name: new RegExp(`^${seat.replace("+", "\\+")}`) })
      .click();
    await expect(page.getByText("✓ Seated.")).toBeVisible();
  }
  const leftover = page.getByText(/Still in your hand:/);
  await expect(leftover).toContainText("The Buyer");
  await expect(leftover).toContainText("The Analyst");
  await page.getByRole("button", { name: "See results" }).click();
  await expect(page.getByText("CHALLENGE COMPLETED", { exact: true })).toBeVisible();
  await expect(page.getByText("5 / 6").first()).toBeVisible();
  await noOverflow(page);

  await page.getByRole("button", { name: "Back to session", exact: true }).click();
  await openSession(page, "LinkedIn");
  await expect(page.getByText("Cindy Leong · 13 Nov 2026")).toBeVisible();
  await expect(page.locator(".session-role")).toHaveText(
    "Head of Scaled Agency Development, APAC",
  );
  await expect(
    page.getByRole("heading", { name: /Cindy Leong.s title/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How she told a brand to get into the answer" }),
  ).toBeVisible();
  await expect(page.getByText("Class notes, 13 Nov 2026 guest session").first()).toBeVisible();
  await expect(page.getByText(/does not include further GEO/)).toHaveCount(0);
  await noOverflow(page);
  await page.getByRole("button", { name: "Start challenge" }).click();
  await expect(page.getByText("Hand 1 of 6")).toBeVisible();
  await noOverflow(page);
  const calls: [RegExp, "Hold" | "Fold"][] = [
    [/Connects the world/, "Hold"],
    [/More than 1 billion members/, "Hold"],
    [/More than 1 million members/, "Fold"],
    [/Fortune 500/, "Hold"],
    [/creator network/, "Fold"],
  ];
  await page
    .getByRole("button", { name: /Fold\. Connects the world/ })
    .click();
  for (const [pattern, call] of calls.slice(1)) {
    await page
      .getByRole("button", { name: new RegExp(`${call}\\..*${pattern.source}`) })
      .click();
  }
  await page.getByRole("button", { name: "Show the hand" }).click();
  await expect(page.getByText("This one is a hold.")).toBeVisible();
  await page.getByRole("button", { name: /Hold\. Connects the world/ }).click();
  await expect(page.getByRole("button", { name: "Next hand" })).toBeEnabled();
  await page.getByRole("button", { name: "Next hand" }).click();
  await expect(page.getByText("Hand 2 of 6")).toBeVisible();
  const rest: [RegExp, "Hold" | "Fold"][][] = [
    [
      [/Talent Solutions, Marketing Solutions/, "Hold"],
      [/Advertising Solutions only/, "Fold"],
      [/Headquartered in Silicon Valley/, "Hold"],
      [/Offices across the globe/, "Hold"],
      [/Headquartered in Singapore/, "Fold"],
    ],
    [
      [/Head of Scaled Agency Development, APAC/, "Hold"],
      [/Head of Marketing Solutions, Global/, "Fold"],
      [/empowering Independent Agencies/, "Hold"],
      [/in-house brand teams/, "Fold"],
      [/tailored support and resources/, "Hold"],
    ],
    [
      [/from SEO TO GEO/, "Hold"],
      [/Programs & Resources/, "Hold"],
      [/Generative Engine Optimisation/, "Hold"],
      [/five-step GEO playbook/, "Fold"],
      [/replaced Talent Solutions/, "Fold"],
    ],
    [
      [/95–5 rule/, "Hold"],
      [/fear of messing up/, "Hold"],
      [/Nobody gets fired for buying IBM/, "Hold"],
      [/convert within two or three months/, "Fold"],
      [/Brand building can wait/, "Fold"],
    ],
    [
      [/two executions/, "Hold"],
      [/do not need a viral post/, "Hold"],
      [/75% of LinkedIn/, "Hold"],
      [/company pages supplied most/, "Fold"],
      [/Paying to boost a post/, "Fold"],
    ],
  ];
  for (let i = 0; i < rest.length; i++) {
    for (const [pattern, call] of rest[i]) {
      await page
        .getByRole("button", {
          name: new RegExp(`${call}\\..*${pattern.source}`),
        })
        .click();
    }
    await page.getByRole("button", { name: "Show the hand" }).click();
    const next = i === rest.length - 1 ? "See results" : "Next hand";
    await page.getByRole("button", { name: next }).click();
  }
  await expect(page.getByText("CHALLENGE COMPLETED", { exact: true })).toBeVisible();
  await expect(page.getByText("29 / 30").first()).toBeVisible();
  await noOverflow(page);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("after-class.progress")!),
  );
  expect(stored.sessions["agentic-ai"].results.handoff).toMatchObject({
    latest: 5,
    best: 5,
    completed: true,
  });
  expect(stored.sessions["linkedin"].results.showdown).toMatchObject({
    latest: 29,
    best: 29,
    completed: true,
  });
});
