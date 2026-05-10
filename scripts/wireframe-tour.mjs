/**
 * Records a guided video tour of TuFolio wireframes with a visible cursor.
 *
 * Usage (dev server must be running on :3100):
 *   node scripts/wireframe-tour.mjs
 *
 * Output: /home/manuel/EXAMS/tour-video/wireframe-tour.mp4 (and the source .webm)
 */
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, renameSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const OUT_DIR = '/home/manuel/EXAMS/tour-video';
const BASE = 'http://localhost:3100';
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
  colorScheme: 'light',
});

// Inject a high-contrast cursor that follows mouse movement on every page.
await context.addInitScript(() => {
  const ensureCursor = () => {
    if (document.getElementById('__pw_cursor__')) return;
    const cursor = document.createElement('div');
    cursor.id = '__pw_cursor__';
    cursor.style.cssText = [
      'position:fixed',
      'left:-100px',
      'top:-100px',
      'width:18px',
      'height:18px',
      'border-radius:50%',
      'background:white',
      'border:2px solid #0f172a',
      'pointer-events:none',
      'z-index:2147483647',
      'transform:translate(-50%,-50%)',
      'box-shadow:0 0 0 1px rgba(255,255,255,0.7), 0 4px 14px rgba(15,23,42,0.55)',
      'transition:width 140ms cubic-bezier(.2,0,.1,1), height 140ms cubic-bezier(.2,0,.1,1), background 140ms, box-shadow 140ms',
      'will-change:left,top,width,height',
    ].join(';');

    const ripple = document.createElement('div');
    ripple.id = '__pw_ripple__';
    ripple.style.cssText = [
      'position:fixed',
      'left:-100px',
      'top:-100px',
      'width:0px',
      'height:0px',
      'border-radius:50%',
      'background:rgba(13,148,136,0.35)',
      'border:2px solid #0d9488',
      'pointer-events:none',
      'z-index:2147483646',
      'transform:translate(-50%,-50%)',
      'opacity:0',
      'transition:width 350ms cubic-bezier(.2,0,.1,1), height 350ms cubic-bezier(.2,0,.1,1), opacity 350ms',
    ].join(';');

    document.body.appendChild(ripple);
    document.body.appendChild(cursor);

    addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    addEventListener('mousedown', (e) => {
      cursor.style.width = '26px';
      cursor.style.height = '26px';
      cursor.style.background = '#0d9488';
      cursor.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.7), 0 0 0 8px rgba(13,148,136,0.25), 0 6px 18px rgba(13,148,136,0.5)';

      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.width = '0px';
      ripple.style.height = '0px';
      ripple.style.opacity = '0.7';
      requestAnimationFrame(() => {
        ripple.style.width = '60px';
        ripple.style.height = '60px';
        ripple.style.opacity = '0';
      });
    });
    addEventListener('mouseup', () => {
      cursor.style.width = '18px';
      cursor.style.height = '18px';
      cursor.style.background = 'white';
      cursor.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.7), 0 4px 14px rgba(15,23,42,0.55)';
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCursor);
  } else {
    ensureCursor();
  }
  // Re-inject on Next.js client-side route change (the cursor is re-mounted because body content changes)
  const observer = new MutationObserver(() => ensureCursor());
  if (document.body) observer.observe(document.body, { childList: true });
  else document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true }));
});

const page = await context.newPage();

// === helpers ============================================================

const sleep = (ms) => page.waitForTimeout(ms);

async function moveTo(x, y, steps = 28) {
  await page.mouse.move(x, y, { steps });
}

async function moveToLocator(locator, opts = {}) {
  const { offsetX = 0, offsetY = 0, steps = 28 } = opts;
  const box = await locator.boundingBox();
  if (!box) return null;
  const cx = box.x + box.width / 2 + offsetX;
  const cy = box.y + box.height / 2 + offsetY;
  await moveTo(cx, cy, steps);
  return { cx, cy, box };
}

async function clickWithCursor(locator, opts = {}) {
  const target = await moveToLocator(locator, opts);
  if (!target) {
    console.warn('clickWithCursor: locator not found');
    return;
  }
  await sleep(380);
  await page.mouse.down();
  await sleep(110);
  await page.mouse.up();
}

async function navAndWait(url, settle = 900) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await sleep(settle);
}

async function clickAndNav(locator, opts = {}) {
  await moveToLocator(locator, opts);
  await sleep(380);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    locator.click(),
  ]);
  await sleep(900);
}

async function smoothScroll(deltaY, chunks = 8, perChunkMs = 80) {
  const step = deltaY / chunks;
  for (let i = 0; i < chunks; i++) {
    await page.mouse.wheel(0, step);
    await sleep(perChunkMs);
  }
}

async function caption(text, durationMs = 2400) {
  await page.evaluate(({ text, durationMs }) => {
    const existing = document.getElementById('__pw_caption__');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = '__pw_caption__';
    el.textContent = text;
    el.style.cssText = [
      'position:fixed',
      'bottom:32px',
      'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'background:rgba(15,23,42,0.92)',
      'color:white',
      'font-family:Geist, system-ui, sans-serif',
      'font-size:16px',
      'font-weight:500',
      'padding:12px 22px',
      'border-radius:12px',
      'z-index:2147483645',
      'opacity:0',
      'transition:opacity 240ms cubic-bezier(.2,0,.1,1), transform 240ms cubic-bezier(.2,0,.1,1)',
      'box-shadow:0 8px 28px rgba(15,23,42,0.35)',
      'letter-spacing:0.01em',
      'pointer-events:none',
      'white-space:nowrap',
    ].join(';');
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => el.remove(), 280);
    }, durationMs);
  }, { text, durationMs });
}

// === flow ===============================================================

console.log('[tour] start');

// 1. Index page
await navAndWait('/wireframes', 600);
await caption('Tour de wireframes Fase 2B', 2200);
await sleep(2300);
await moveTo(720, 380);
await sleep(900);

// 2. Click sign-in card
const signInCard = page.locator('a[href="/wireframes/sign-in"]').first();
await caption('Empezamos por el login', 1600);
await sleep(800);
await clickAndNav(signInCard);

// 3. Sign-in: type email + password, hover submit
await caption('Email + contraseña, headline en Source Serif 4', 2200);
await sleep(800);

const emailInput = page.locator('#email');
await moveToLocator(emailInput, { offsetX: -120 });
await sleep(300);
await emailInput.click();
await emailInput.type('manu@tufolio.es', { delay: 80 });
await sleep(500);

const passwordInput = page.locator('#password');
await moveToLocator(passwordInput, { offsetX: -120 });
await sleep(300);
await passwordInput.click();
await passwordInput.type('Password123', { delay: 70 });
await sleep(500);

const submitBtn = page.getByRole('button', { name: /inicia sesi/i });
await moveToLocator(submitBtn);
await sleep(900);

// 4. Home (sign-in submit is a wireframe stub, so we navigate manually)
await caption('Dashboard del estudiante', 1800);
await navAndWait('/wireframes/home', 1100);

// Hover ContinueCTA
const continueCta = page.locator('a[href="/wireframes/lesson"]').first();
await moveToLocator(continueCta, { offsetX: -200 });
await sleep(900);

// Click "Mis cursos" sidebar link
const cursosNav = page.locator('aside a[href="/wireframes/courses"]').first();
await caption('"Mis cursos" en la sidebar', 1600);
await sleep(700);
await clickAndNav(cursosNav);

// 5. Courses list — click a course card
await caption('Listado de cursos inscritos', 1800);
await sleep(900);
const firstCourseCard = page.locator('a[href^="/wireframes/courses/"]').first();
await moveToLocator(firstCourseCard);
await sleep(800);
await clickAndNav(firstCourseCard);

// 6. Course detail — scroll, then enter lesson
await caption('Detalle del curso · KPIs en hero', 2000);
await sleep(1000);
await smoothScroll(280);
await sleep(900);
await smoothScroll(320);
await sleep(1200);
await smoothScroll(-300);
await sleep(700);

// Click the active "Continuar" / lesson link
const lessonLink = page.locator('a[href="/wireframes/lesson"]').first();
await caption('Continuar lección 2.3', 1600);
await sleep(700);
await clickAndNav(lessonLink);

// 7. Lesson reader — scroll through body
await caption('Lectura · Source Serif 4 + drop cap', 2200);
await sleep(1100);
await smoothScroll(280);
await sleep(1500);
await smoothScroll(320);
await sleep(1500);
await smoothScroll(280);
await sleep(1500);
await smoothScroll(-500);
await sleep(800);

// 8. Quiz — click "Hacer test"
const quizLink = page.locator('a[href="/wireframes/quiz"]').first();
if (await quizLink.count()) {
  await caption('"Hacer test" tras la lección', 1700);
  await sleep(700);
  await clickAndNav(quizLink);
} else {
  await navAndWait('/wireframes/quiz', 1100);
}

// 9. Quiz — hover an answer option
await caption('Test · 4 opciones, ring teal en seleccionada', 2200);
await sleep(1000);
const firstOption = page.locator('label').filter({ hasText: /^[A-D]\b|opción|persona/i }).first();
if (await firstOption.count()) {
  await moveToLocator(firstOption, { offsetX: -120 });
  await sleep(800);
}
const radios = page.locator('[role="radio"]');
if (await radios.count()) {
  const second = radios.nth(1);
  await moveToLocator(second);
  await sleep(500);
  await second.click().catch(() => {});
  await sleep(900);
}

// 10. Leaderboard (focus layout has no sidebar; navigate by URL)
await caption('Ranking semanal', 1700);
await navAndWait('/wireframes/leaderboard', 1100);
await sleep(1000);
await smoothScroll(300);
await sleep(1300);
await smoothScroll(300);
await sleep(1500);
await smoothScroll(-400);
await sleep(700);

// Click "Noticias" in sidebar
const newsNav = page.locator('aside a[href="/wireframes/news"]').first();
if (await newsNav.count()) {
  await caption('"Noticias" en la sidebar', 1500);
  await sleep(700);
  await clickAndNav(newsNav);
} else {
  await navAndWait('/wireframes/news', 1100);
}

// 11. News
await caption('Convocatorias, cambios de temario y tips', 2200);
await sleep(1100);
await smoothScroll(300);
await sleep(1500);
await smoothScroll(300);
await sleep(1500);
await smoothScroll(300);
await sleep(1800);

// End card
await caption('Fin del tour ·  TuFolio', 2400);
await sleep(2500);

console.log('[tour] flow done; closing context to flush video');

const videoPath = await page.video()?.path();
await context.close();
await browser.close();

// Locate the produced webm and rename to a fixed filename, then convert to mp4
const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.webm'));
if (files.length === 0) {
  console.error('No webm output found');
  process.exit(1);
}
const latestWebm = files
  .map((f) => ({ f, t: existsSync(join(OUT_DIR, f)) ? 0 : 0 }))
  .map(({ f }) => join(OUT_DIR, f))
  .sort()
  .pop();

const finalWebm = join(OUT_DIR, 'wireframe-tour.webm');
if (latestWebm !== finalWebm) {
  renameSync(latestWebm, finalWebm);
}
console.log('[tour] webm:', finalWebm);

try {
  const mp4Path = join(OUT_DIR, 'wireframe-tour.mp4');
  execSync(
    `ffmpeg -y -i "${finalWebm}" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`,
    { stdio: 'inherit' },
  );
  console.log('[tour] mp4:', mp4Path);
} catch (e) {
  console.warn('[tour] ffmpeg conversion failed; webm available at', finalWebm);
}
