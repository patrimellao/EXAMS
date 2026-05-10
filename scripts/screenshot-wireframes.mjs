import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.WIREFRAME_BASE ?? "http://localhost:3100";
const OUT = "docs/ui/screenshots";

const pages = [
  { name: "00-index", path: "/wireframes" },
  { name: "01-home", path: "/wireframes/home" },
  { name: "02-courses", path: "/wireframes/courses" },
  { name: "03-course-detail", path: "/wireframes/courses/derecho-civil" },
  { name: "04-leaderboard", path: "/wireframes/leaderboard" },
  { name: "05-quiz", path: "/wireframes/quiz" },
  { name: "06-lesson", path: "/wireframes/lesson" },
  { name: "07-sign-in", path: "/wireframes/sign-in" },
];

const onlyTheme = process.env.THEME;
const onlyViewport = process.env.VIEWPORT;
const onlyPage = process.env.PAGE;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

const themes = onlyTheme ? [onlyTheme] : ["light", "dark"];
const viewports = (onlyViewport ? [onlyViewport] : ["desktop", "mobile"]).map(
  (v) =>
    v === "mobile"
      ? { label: "mobile", width: 390, height: 844 }
      : { label: "desktop", width: 1440, height: 900 },
);

for (const theme of themes) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      colorScheme: theme,
    });

    for (const p of pages.filter((p) => !onlyPage || p.name.includes(onlyPage))) {
      const page = await context.newPage();
      const url = BASE + p.path;
      // Pre-set theme cookie so next-themes picks it up before first paint
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {}
      }, theme);
      process.stdout.write(`[${theme}/${viewport.label}] ${url} … `);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        // Force theme class via next-themes localStorage key
        await page.evaluate((t) => {
          localStorage.setItem("theme", t);
          document.documentElement.classList.toggle("dark", t === "dark");
          document.documentElement.classList.toggle("light", t === "light");
          document.documentElement.style.colorScheme = t;
        }, theme);
        await page.waitForTimeout(500);
        const file = `${OUT}/${p.name}-${theme}-${viewport.label}.png`;
        await page.screenshot({ path: file, fullPage: true });
        console.log("OK");
      } catch (err) {
        console.log("ERR", err.message);
      }
      await page.close();
    }

    await context.close();
  }
}

await browser.close();
console.log(`\nDone. Screenshots in ${OUT}/`);
