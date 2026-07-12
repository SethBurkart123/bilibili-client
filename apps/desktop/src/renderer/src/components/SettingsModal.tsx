import { useEffect, useId, useState } from "react";
import type { TranslatorProvider, TranslatorSettings } from "@bili/types";
import { bridge } from "../lib/bridge";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const titleId = useId();
  const [settings, setSettings] = useState<TranslatorSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    void bridge.getSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !settings) return null;

  const provider = settings.provider;

  async function onSave(): Promise<void> {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const payload: TranslatorSettings = {
        provider: settings.provider,
        targetLang: settings.targetLang.trim() || "en",
      };
      if (settings.provider === "openai") {
        payload.openai = {
          baseURL: settings.openai?.baseURL ?? "",
          apiKey: settings.openai?.apiKey ?? "",
          model: settings.openai?.model ?? "",
        };
      }
      await bridge.setSettings(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>Settings</h2>

        <div className="form-field">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => {
              const next = e.target.value as TranslatorProvider;
              setSettings((prev) =>
                prev
                  ? {
                      ...prev,
                      provider: next,
                      openai:
                        prev.openai ??
                        ({ baseURL: "", apiKey: "", model: "" } as const),
                    }
                  : prev,
              );
            }}
          >
            <option value="google">google</option>
            <option value="openai">openai</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="targetLang">Target language</label>
          <input
            id="targetLang"
            value={settings.targetLang}
            onChange={(e) =>
              setSettings((prev) => (prev ? { ...prev, targetLang: e.target.value } : prev))
            }
          />
        </div>

        {provider === "openai" && (
          <>
            <div className="form-field">
              <label htmlFor="baseURL">OpenAI base URL</label>
              <input
                id="baseURL"
                value={settings.openai?.baseURL ?? ""}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          openai: {
                            baseURL: e.target.value,
                            apiKey: prev.openai?.apiKey ?? "",
                            model: prev.openai?.model ?? "",
                          },
                        }
                      : prev,
                  )
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="apiKey">API key</label>
              <input
                id="apiKey"
                type="password"
                value={settings.openai?.apiKey ?? ""}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          openai: {
                            baseURL: prev.openai?.baseURL ?? "",
                            apiKey: e.target.value,
                            model: prev.openai?.model ?? "",
                          },
                        }
                      : prev,
                  )
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="model">Model</label>
              <input
                id="model"
                value={settings.openai?.model ?? ""}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          openai: {
                            baseURL: prev.openai?.baseURL ?? "",
                            apiKey: prev.openai?.apiKey ?? "",
                            model: e.target.value,
                          },
                        }
                      : prev,
                  )
                }
              />
            </div>
          </>
        )}

        {error && <p className="status-line">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
