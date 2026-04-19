/**
 * Preconditions test suite
 * ========================
 * Verifies the setup needed for auth to work:
 *  1. .env.local exists and DATABASE_URL is set
 *  2. All required DB tables exist
 *  3. users.id column is type TEXT (not UUID) — the exact bug from the auth outage
 */

import { test, expect } from '../fixtures';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const REQUIRED_TABLES = [
  'users',
  'sessions',
  'accounts',
  'verifications',
];

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/jeanmonnet';

test.describe('Auth Preconditions', () => {
  test('DATABASE_URL env var is set', () => {
    // Either loaded from .env.local by playwright.config.ts or set in the shell
    expect(
      process.env.DATABASE_URL,
      'DATABASE_URL must be set in .env.local — copy .env.example and fill it in'
    ).toBeTruthy();
  });

  test('.env.local file exists', () => {
    const envPath = path.resolve(process.cwd(), '.env.local');
    expect(
      fs.existsSync(envPath),
      '.env.local not found — copy .env.example to .env.local and fill in the values'
    ).toBe(true);
  });

  test('Required DB tables exist', async () => {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
      const result = await client.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
      );
      const existingTables = result.rows.map((r) => r.tablename);

      for (const table of REQUIRED_TABLES) {
        expect(
          existingTables,
          `Table "${table}" is missing — run: npx drizzle-kit push --dialect postgresql --schema ./schemas --url $DATABASE_URL --force`
        ).toContain(table);
      }
    } finally {
      await client.end();
    }
  });

  test('users.id column type is TEXT (not UUID)', async () => {
    // Regression guard: Better Auth generates alphanumeric string IDs.
    // If users.id is uuid, sign-up throws "invalid input syntax for type uuid".
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
      const result = await client.query<{ data_type: string }>(
        `SELECT data_type
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'users'
           AND column_name  = 'id'`
      );

      expect(
        result.rows.length,
        'users.id column not found — the users table may not exist'
      ).toBe(1);

      expect(
        result.rows[0].data_type,
        'users.id must be "text" not "uuid". Better Auth generates non-UUID string IDs. ' +
          'Fix schemas/users.ts: change uuid("id") → text("id") and re-push the schema.'
      ).toBe('text');
    } finally {
      await client.end();
    }
  });

  test('sessions.userId column type is TEXT', async () => {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    try {
      const result = await client.query<{ data_type: string }>(
        `SELECT data_type
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'sessions'
           AND column_name  = 'user_id'`
      );

      expect(result.rows.length).toBe(1);
      expect(
        result.rows[0].data_type,
        'sessions.user_id must be "text" — matches Better Auth string IDs'
      ).toBe('text');
    } finally {
      await client.end();
    }
  });
});
