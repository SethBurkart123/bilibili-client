import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  LoginPollStatus,
  LoginState,
  TranslatorProvider,
  TranslatorSettings,
} from "@bili/types";
import QRCode from "qrcode";
import { bridge } from "../lib/bridge";

interface Props {
  open: boolean;
  onClose: () => void;
  loginState: LoginState;
  onLoginStateChange: (state: LoginState) => void;
  onSaved?: () => void;
}

const POLL_MS = 2000;

function statusMessage(status: LoginPollStatus | "starting"): string {
  switch (status) {
    case "starting":
      return "Preparing QR code…";
    case "waiting":
      return "Scan with the bilibili app";
    case "scanned":
      return "Scanned — confirm on your phone";
    case "expired":
      return "Expired — tap to regenerate";
    case "success":
      return "Logged in";
    default:
      return "";
  }
}

export function SettingsModal({
  open,
  onClose,
  loginState,
  onLoginStateChange,
  onSaved,
}: Props) {
  const titleId = useId();
  const [settings, setSettings] = useState<TranslatorSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) {
      setQrOpen(false);
      return;
    }
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
        ui: {
          showOriginalOnHover: settings.ui?.showOriginalOnHover !== false,
        },
      };
      if (settings.provider === "openai") {
        payload.openai = {
          baseURL: settings.openai?.baseURL ?? "",
          apiKey: settings.openai?.apiKey ?? "",
          model: settings.openai?.model ?? "",
        };
      }
      await bridge.setSettings(payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function onLogout(): Promise<void> {
    setLoggingOut(true);
    setError(null);
    try {
      await bridge.logout();
      onLoginStateChange({ loggedIn: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoggingOut(false);
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

        <section className="settings-section">
          <h3 className="settings-section-title">Account</h3>
          {loginState.loggedIn ? (
            <div className="account-row">
              {loginState.face ? (
                <img
                  className="account-avatar"
                  src={loginState.face}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="account-avatar account-avatar-fallback" aria-hidden />
              )}
              <div className="account-meta">
                <div className="account-uname">{loginState.uname ?? "Logged in"}</div>
                {loginState.mid != null && (
                  <div className="account-mid">UID {loginState.mid}</div>
                )}
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => void onLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          ) : (
            <div className="account-row">
              <p className="account-hint">Log in to unlock higher stream qualities.</p>
              <button type="button" className="primary-btn" onClick={() => setQrOpen(true)}>
                Log in with QR
              </button>
            </div>
          )}
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Translation</h3>

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

          <div className="form-field form-field-checkbox">
            <label htmlFor="showOriginalOnHover">
              <input
                id="showOriginalOnHover"
                type="checkbox"
                checked={settings.ui?.showOriginalOnHover !== false}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          ui: {
                            ...prev.ui,
                            showOriginalOnHover: e.target.checked,
                          },
                        }
                      : prev,
                  )
                }
              />
              Show original on hover
            </label>
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
        </section>

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

      {qrOpen && (
        <LoginQrModal
          onClose={() => setQrOpen(false)}
          onSuccess={async () => {
            const state = await bridge.getLoginState();
            onLoginStateChange(state);
            setQrOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}

function LoginQrModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const titleId = useId();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginPollStatus | "starting">("starting");
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const startQr = useCallback(async () => {
    setError(null);
    setStatus("starting");
    setQrDataUrl(null);
    try {
      const qr = await bridge.loginQrStart();
      if (cancelledRef.current) return;
      keyRef.current = qr.qrcodeKey;
      const dataUrl = await QRCode.toDataURL(qr.url, {
        margin: 1,
        width: 220,
        color: { dark: "#0f1115", light: "#ffffff" },
      });
      if (cancelledRef.current) return;
      setQrDataUrl(dataUrl);
      setStatus("waiting");
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void startQr();
    return () => {
      cancelledRef.current = true;
    };
  }, [startQr]);

  useEffect(() => {
    if (status !== "waiting" && status !== "scanned") return;
    const key = keyRef.current;
    if (!key) return;

    const id = window.setInterval(() => {
      void (async () => {
        try {
          const result = await bridge.loginQrPoll(key);
          if (cancelledRef.current) return;
          setStatus(result.status);
          if (result.status === "success") {
            window.clearInterval(id);
            await onSuccess();
          } else if (result.status === "expired") {
            window.clearInterval(id);
          }
        } catch (err) {
          if (!cancelledRef.current) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }
      })();
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [status, onSuccess]);

  return (
    <div
      className="modal-backdrop qr-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal qr-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>Log in with QR</h2>
        <button
          type="button"
          className="qr-code-btn"
          onClick={() => {
            if (status === "expired" || error) void startQr();
          }}
          disabled={status !== "expired" && !error}
          title={status === "expired" ? "Tap to regenerate" : undefined}
        >
          {qrDataUrl ? (
            <img className="qr-code-img" src={qrDataUrl} alt="Bilibili login QR code" />
          ) : (
            <div className="qr-code-placeholder">…</div>
          )}
        </button>
        <p className="status-line qr-status">{error ?? statusMessage(status)}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
