import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "cloudflare:workers";

export const SESSION_COOKIE = "lanelab_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_RESET_MAX_AGE_MINUTES = 20;

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  clubName: string | null;
  clubRole: string | null;
  clubCity: string | null;
  clubCourse: string | null;
};

type StoredUser = AppUser & {
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
};

let schemaReady: Promise<void> | null = null;

export function authDatabaseAvailable() {
  return Boolean(env.DB);
}

export async function ensureAuthSchema() {
  if (!env.DB) throw new Error("LaneLab account storage is unavailable.");
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.batch([
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          password_iterations INTEGER NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          club_name TEXT,
          club_role TEXT,
          club_city TEXT,
          club_course TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)"),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)"),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL
        )`),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id)"),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS password_reset_expiry_idx ON password_reset_tokens(expires_at)"),
      ]);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validatePassword(value: string) {
  if (value.length < 10) return "Use at least 10 characters.";
  if (value.length > 128) return "Password is too long.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Include uppercase, lowercase, and a number.";
  }
  return null;
}

export async function createAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  clubName?: string;
  clubRole?: string;
  clubCity?: string;
  clubCourse?: string;
}) {
  await ensureAuthSchema();
  const email = normalizeEmail(input.email);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePassword(input.password, salt, PASSWORD_ITERATIONS);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(`INSERT INTO users (
    id, email, password_hash, password_salt, password_iterations, full_name,
    phone, club_name, club_role, club_city, club_course, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      email,
      toBase64Url(passwordHash),
      toBase64Url(salt),
      PASSWORD_ITERATIONS,
      input.fullName.trim(),
      cleanOptional(input.phone),
      cleanOptional(input.clubName),
      cleanOptional(input.clubRole),
      cleanOptional(input.clubCity),
      cleanOptional(input.clubCourse),
      now,
      now,
    )
    .run();

  return getUserById(id);
}

export async function verifyCredentials(emailValue: string, password: string) {
  await ensureAuthSchema();
  const email = normalizeEmail(emailValue);
  const row = await env.DB.prepare(`SELECT
    id, email, password_hash AS passwordHash, password_salt AS passwordSalt,
    password_iterations AS passwordIterations, full_name AS displayName,
    phone, club_name AS clubName, club_role AS clubRole, club_city AS clubCity,
    club_course AS clubCourse
    FROM users WHERE email = ? LIMIT 1`)
    .bind(email)
    .first<StoredUser>();

  if (!row) {
    await derivePassword(password, new Uint8Array(16), PASSWORD_ITERATIONS);
    return null;
  }

  const expected = fromBase64Url(row.passwordHash);
  const actual = await derivePassword(password, fromBase64Url(row.passwordSalt), row.passwordIterations);
  return constantTimeEqual(expected, actual) ? sanitizeUser(row) : null;
}

export async function createSession(userId: string) {
  await ensureAuthSchema();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64Url(tokenBytes);
  const id = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, userId, expiresAt.toISOString(), now.toISOString())
    .run();
  return { token, expiresAt };
}

export async function deleteSession(token: string | undefined) {
  if (!token || !env.DB) return;
  await ensureAuthSchema();
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
}

export async function createPasswordResetToken(emailValue: string) {
  await ensureAuthSchema();
  const email = normalizeEmail(emailValue);
  const user = await env.DB.prepare("SELECT id, email, full_name AS displayName FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; email: string; displayName: string }>();
  if (!user) return null;

  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const id = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_MAX_AGE_MINUTES * 60 * 1000);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= ? OR used_at IS NOT NULL").bind(user.id, now.toISOString()),
    env.DB.prepare("INSERT INTO password_reset_tokens (id, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)")
      .bind(id, user.id, expiresAt.toISOString(), now.toISOString()),
  ]);
  return { token, email: user.email, displayName: user.displayName, expiresAt };
}

export async function resetPasswordWithToken(token: string, password: string) {
  await ensureAuthSchema();
  const id = await sha256(token);
  const now = new Date().toISOString();
  const reset = await env.DB.prepare("SELECT user_id AS userId FROM password_reset_tokens WHERE id = ? AND used_at IS NULL AND expires_at > ? LIMIT 1")
    .bind(id, now)
    .first<{ userId: string }>();
  if (!reset) return false;

  const consumed = await env.DB.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ?")
    .bind(now, id, now)
    .run();
  if (!consumed.meta.changes) return false;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?")
      .bind(toBase64Url(passwordHash), toBase64Url(salt), PASSWORD_ITERATIONS, now, reset.userId),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(reset.userId),
  ]);
  return true;
}

export async function getAppUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  return getUserFromToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getAppUserFromRequest(request: NextRequest): Promise<AppUser | null> {
  return getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

async function getUserFromToken(token: string | undefined): Promise<AppUser | null> {
  if (!token || !env.DB) return null;
  await ensureAuthSchema();
  const row = await env.DB.prepare(`SELECT
    u.id, u.email, u.full_name AS displayName, u.phone,
    u.club_name AS clubName, u.club_role AS clubRole,
    u.club_city AS clubCity, u.club_course AS clubCourse
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ? LIMIT 1`)
    .bind(await sha256(token), new Date().toISOString())
    .first<AppUser>();
  return row ? sanitizeUser(row) : null;
}

async function getUserById(id: string) {
  const row = await env.DB.prepare(`SELECT
    id, email, full_name AS displayName, phone, club_name AS clubName,
    club_role AS clubRole, club_city AS clubCity, club_course AS clubCourse
    FROM users WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<AppUser>();
  return row ? sanitizeUser(row) : null;
}

function sanitizeUser(row: AppUser): AppUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    phone: row.phone ?? null,
    clubName: row.clubName ?? null,
    clubRole: row.clubRole ?? null,
    clubCity: row.clubCity ?? null,
    clubCourse: row.clubCourse ?? null,
  };
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function cleanOptional(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, 160) : null;
}
