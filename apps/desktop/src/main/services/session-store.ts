import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { app } from "electron";

function sessionPath(): string {
  return join(app.getPath("userData"), "session.json");
}

export function loadSessionCookies(): Record<string, string> | null {
  const path = sessionPath();
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const cookies: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") cookies[key] = value;
    }
    return cookies;
  } catch {
    return null;
  }
}

export function saveSessionCookies(cookies: Record<string, string>): void {
  const path = sessionPath();
  const dir = app.getPath("userData");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(cookies), { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    // best-effort on platforms that ignore mode
  }
}

export function clearSessionCookies(): void {
  const path = sessionPath();
  if (existsSync(path)) {
    unlinkSync(path);
  }
}
