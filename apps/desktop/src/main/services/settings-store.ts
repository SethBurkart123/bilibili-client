import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { TranslatorSettings } from "@bili/types";
import { DEFAULT_SETTINGS } from "./fixtures";

function settingsPath(): string {
  return join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): TranslatorSettings {
  const path = settingsPath();
  if (!existsSync(path)) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as TranslatorSettings;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      openai: parsed.openai ?? DEFAULT_SETTINGS.openai,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: TranslatorSettings): void {
  const path = settingsPath();
  const dir = app.getPath("userData");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(settings, null, 2), "utf8");
}
