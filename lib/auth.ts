import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/utils/drizzle/db";
import { users, sessions, accounts, verifications } from "@/drizzle/schema";
import { hash as bcryptHash, compare as bcryptVerify } from "bcryptjs";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  user: {
    // Map Better Auth's "name" field to our "fullName" column
    // and "image" to "avatarUrl"
    fields: {
      name: "fullName",
      image: "avatarUrl",
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
        required: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    password: {
      hash: (password) => bcryptHash(password, 10),
      verify: ({ hash, password }) => bcryptVerify(password, hash),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,     // 7 days
    updateAge: 60 * 60 * 24,          // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                  // cache for 5 minutes
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
