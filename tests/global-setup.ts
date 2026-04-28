/**
 * Playwright Global Setup
 * ========================
 * Automatically seeds the DB before the test suite runs.
 * Skips re-seed if .env.test was written less than 1 hour ago (idempotent seed
 * already handles duplicates, but skipping saves ~8 s per run in dev).
 *
 * To force a fresh seed: delete .env.test and re-run tests.
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export default async function globalSetup() {
  const envTestPath = path.resolve(process.cwd(), '.env.test');

  const needsSeed =
    !fs.existsSync(envTestPath) ||
    Date.now() - fs.statSync(envTestPath).mtimeMs > 3_600_000; // 1 hour

  if (needsSeed) {
    console.log('\n🌱  global-setup: seeding test database...');
    execSync('npm run seed', { stdio: 'inherit', cwd: process.cwd() });
  }

  // Load dynamic IDs into the main process so workers inherit them
  dotenv.config({ path: envTestPath, override: true });
}
