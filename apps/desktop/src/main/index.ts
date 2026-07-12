import { join } from "node:path";
import { BrowserWindow, app, ipcMain, session, shell } from "electron";
import type { BiliBridge } from "./services/bridge";
import { flushService, service } from "./services";

const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const HEADER_HOST_PATTERNS = [
  /(^|\.)bilivideo\.com$/i,
  /(^|\.)akamaized\.net$/i,
  /^api\.bilibili\.com$/i,
  /^upos-[a-z0-9-]+\.bilivideo\.com$/i,
];

function shouldInjectHeaders(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return HEADER_HOST_PATTERNS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

function installHeaderInjection(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    if (shouldInjectHeaders(details.url)) {
      requestHeaders.Referer = "https://www.bilibili.com/";
      requestHeaders["User-Agent"] = DESKTOP_CHROME_UA;
    }
    callback({ requestHeaders });
  });
}

const BRIDGE_METHODS = [
  "resolveVideo",
  "getStreams",
  "getComments",
  "getReplies",
  "translate",
  "getSettings",
  "setSettings",
  "getSubtitles",
  "getSubtitleLines",
  "loginQrStart",
  "loginQrPoll",
  "getLoginState",
  "logout",
] as const satisfies ReadonlyArray<keyof BiliBridge>;

function registerIpc(): void {
  for (const method of BRIDGE_METHODS) {
    ipcMain.handle(`bili:${method}`, async (_event, ...args: unknown[]) => {
      const fn = service[method] as (...a: unknown[]) => Promise<unknown>;
      return fn.apply(service, args);
    });
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f1115",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.on("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  installHeaderInjection();
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

let allowingQuit = false;
app.on("before-quit", (event) => {
  if (allowingQuit) return;
  event.preventDefault();
  void flushService()
    .catch((err: unknown) => {
      console.error("Failed to flush translation cache:", err);
    })
    .finally(() => {
      allowingQuit = true;
      app.quit();
    });
});
