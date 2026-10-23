import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const key = "after-class.progress";
async function start(page: Page, name: string) {
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .getByRole("button", { name: /Start challenge|Try again|Resume challenge/ })
    .click();
}
async function sort(page: Page) {
  const order = [
    "Design the interface.",
    "Build the working website.",
    "Commit and push the code to GitHub.",
    "Connect the repository and deploy with Vercel.",
  ];
  for (let to = 0; to < order.length; to++) {
    let from = await page
      .locator(".pipeline-list .step-text")
      .allTextContents()
      .then((x) => x.indexOf(order[to]));
    while (from > to) {
      await page
        .getByRole("button", { name: `Move ${order[to]} up`, exact: true })
        .click();
      from--;
    }
  }
}
async function pair(page: Page, task: string, answer: string) {
  await page.getByRole("button", { name: task, exact: true }).click();
  await page.getByRole("button", { name: answer, exact: true }).click();
}
const tools = [
  ["Store code and track its history", "GitHub"],
  ["Deploy and host a website", "Vercel"],
  ["Build and debug a project", "Claude Code"],
  ["Add authentication and a database", "Supabase"],
];
const files = [
  ["Change the button text", "index.html"],
  ["Change the button colour", "styles.css"],
  ["Make the button respond to a click", "script.js"],
];

test("complete all three challenges; scores, retries, refresh and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("tab")).toHaveCount(1);
  await page.getByRole("button", { name: /A quick refresher/ }).click();
  await expect(
    page.getByRole("heading", { name: "A commit stays local until you push" }),
  ).toBeVisible();
  await start(page, "Build the Pipeline");
  await expect(
    page.getByRole("heading", { name: "A commit stays local until you push" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check order" }).click();
  await expect(page.getByText("↻ A little rearranging needed.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("↻ A little rearranging needed.")).toBeVisible();
  await sort(page);
  await page.getByRole("button", { name: "Check order" }).click();
  await expect(
    page.getByText("CHALLENGE COMPLETED", { exact: true }),
  ).toBeVisible();
  let stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions["vibe-coding"].results.pipeline).toMatchObject({
    latest: 0,
    best: 0,
    completed: true,
  });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByText("First submission counts · 1 point possible"),
  ).toBeVisible();
  await expect(page.getByText("↻ A little rearranging needed.")).toHaveCount(0);
  await sort(page);
  await page.getByRole("button", { name: "Check order" }).click();
  stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions["vibe-coding"].results.pipeline).toMatchObject({
    latest: 1,
    best: 1,
  });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("button", { name: "Check order" }).click();
  await sort(page);
  await page.getByRole("button", { name: "Check order" }).click();
  stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions["vibe-coding"].results.pipeline).toMatchObject({
    latest: 0,
    best: 1,
    completed: true,
  });
  await page
    .getByRole("button", { name: "Back to session", exact: true })
    .last()
    .click();
  await start(page, "Match the Role");
  await expect(
    page.getByRole("button", { name: "GitHub", exact: true }),
  ).toBeDisabled();
  await pair(page, tools[0][0], "Vercel");
  await expect(
    page.getByText("↻ Not this connection. Try another."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: tools[0][0], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "GitHub", exact: true }).click();
  await expect(
    page.getByText(
      "A repository keeps your files and the history of changes together.",
    ),
  ).toBeVisible();
  for (const [task, answer] of tools.slice(1)) await pair(page, task, answer);
  await page.getByRole("button", { name: "Next round" }).click();
  await expect(
    page.getByText(
      "React and other frameworks may organise files differently.",
      { exact: false },
    ),
  ).toBeVisible();
  for (const [task, answer] of files) await pair(page, task, answer);
  await page.getByRole("button", { name: "See results" }).click();
  stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions["vibe-coding"].results.roles).toMatchObject({
    latest: 6,
    best: 6,
    completed: true,
  });
  await page
    .getByRole("button", { name: "Back to session", exact: true })
    .last()
    .click();
  await start(page, "Fix the Launch");
  await page.getByRole("button", { name: /Make another commit/ }).click();
  await expect(
    page.getByText(/Another local snapshot will not upload/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Push the commits to GitHub/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next situation" }).click();
  for (const text of [
    "Create a pull request.",
    "Connect the repository to Vercel and deploy.",
    "Authentication and persistent storage, for example with Supabase.",
  ]) {
    await page.getByRole("button", { name: text, exact: false }).click();
    await page.getByRole("button", { name: "Next situation" }).click();
  }
  await expect(page.getByText("Extra tip · beyond the lecture")).toBeVisible();
  await page
    .getByRole("button", { name: /Save progress with localStorage/ })
    .click();
  await page.getByRole("button", { name: "See results" }).click();
  stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions["vibe-coding"].results.launch).toMatchObject({
    latest: 4,
    best: 4,
    completed: true,
  });
  await page
    .getByRole("button", { name: "Back to session", exact: true })
    .last()
    .click();
  await expect(page.getByText("Session wrapped.")).toBeVisible();
  await expect(page.locator(".status.is-done")).toHaveCount(3);
  await page.reload();
  await page
    .getByRole("button", { name: "Back to session", exact: true })
    .last()
    .click();
  await expect(page.getByText("Session wrapped.")).toBeVisible();
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep progress" }).click();
  await expect(page.getByText("Session wrapped.")).toBeVisible();
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await expect(page.locator(".status.is-done")).toHaveCount(0);
  stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.sessions).toEqual({});
  await page.reload();
  await expect(page.locator(".status.is-done")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("no horizontal overflow, source access, and accessibility checks", async ({
  page,
}, info) => {
  await page.goto("/");
  const check = async () => {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await check();
  await page.screenshot({
    path: info.outputPath("session.png"),
    fullPage: true,
  });
  await page.getByText("About the content & sources", { exact: true }).click();
  const source = page.getByRole("link", { name: /LaunchLab: Claude Design/ });
  expect(
    (await page.request.get((await source.getAttribute("href"))!)).headers()[
      "content-type"
    ],
  ).toContain("application/pdf");
  await page.getByRole("button", { name: /A quick refresher/ }).click();
  await check();
  await start(page, "Build the Pipeline");
  await check();
  await page.screenshot({
    path: info.outputPath("pipeline.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Check order" }).click();
  await check();
  await page.getByRole("button", { name: /Back to session/ }).click();
  await start(page, "Match the Role");
  await check();
  await page.screenshot({
    path: info.outputPath("matching.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Back to session/ }).click();
  await start(page, "Fix the Launch");
  await check();
  await page.getByRole("button", { name: /Make another commit/ }).click();
  await check();
});

test("corrupt, incompatible, and unavailable storage remain playable", async ({
  page,
  context,
}) => {
  await page.goto("/");
  for (const raw of [
    "{broken",
    '{"schema":0}',
    '{"schema":1,"sessions":{"vibe-coding":{"contentVersion":0,"results":{},"active":null}}}',
  ]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw,
    });
    await page.reload();
    await expect(
      page.getByText(/Some saved progress was outdated or unreadable/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start challenge" }),
    ).toHaveCount(3);
  }
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.reload();
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
  await start(page, "Build the Pipeline");
  await sort(page);
  await page.getByRole("button", { name: "Check order" }).click();
  await expect(
    page.getByText("CHALLENGE COMPLETED", { exact: true }),
  ).toBeVisible();
});

test("keyboard-only controls and native reset cancellation", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("tab").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab")).toBeFocused();
  await page.getByRole("button", { name: /A quick refresher/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /A quick refresher/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .locator(".challenge-card")
    .first()
    .getByRole("button", { name: "Start challenge" })
    .focus();
  await page.keyboard.press("Enter");
  const movable = page
    .locator(".pipeline-list li")
    .nth(1)
    .getByRole("button", { name: / up$/ });
  await movable.focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(
    "BUTTON",
  );
  await page.getByRole("button", { name: /Back to session/ }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset progress", exact: true }),
  ).toBeFocused();
});

test("desktop drag reorders steps", async ({ page }, info) => {
  test.skip(
    info.project.name === "mobile",
    "Mobile uses tested arrow controls rather than drag.",
  );
  await page.goto("/");
  await start(page, "Build the Pipeline");
  const before = await page
    .locator(".pipeline-list .step-text")
    .allTextContents();
  await page
    .locator(".pipeline-list li")
    .first()
    .dragTo(page.locator(".pipeline-list li").last());
  expect(
    await page.locator(".pipeline-list .step-text").allTextContents(),
  ).toEqual([...before.slice(1), before[0]]);
});
