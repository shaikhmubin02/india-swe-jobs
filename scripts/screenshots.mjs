// Refresh the images in docs/ against a running server.
//
//   npm run dev            # or: npm start  (port 4321)
//   npm run shots
//
// Plain `chrome --screenshot` is not enough: the theme lives in a localStorage
// key that has to be seeded before the page is captured, so this drives Chrome
// over CDP instead. Chrome/Edge is located automatically.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.SHOT_BASE || "http://localhost:4321";
const PORT = Number(process.env.SHOT_PORT || 9333);
const WIDTH = 1440;
const VIEWPORT_H = 1000;
const MAX_H = 6000;

const SHOTS = [
  { file: "shot-home.png", path: "/", theme: "dark", label: "home (dark)" },
  { file: "shot-light.png", path: "/", theme: "light", label: "home (light)" },
  { file: "shot-city.png", path: "/city/bengaluru", theme: "dark", label: "city" },
  { file: "shot-companies.png", path: "/companies", theme: "dark", label: "companies" },
  { file: "shot-walkins.png", path: "/walkins", theme: "dark", label: "walk-ins" },
  { file: "shot-about.png", path: "/about", theme: "dark", label: "about" },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("no Chrome/Edge found — set CHROME_PATH");
  process.exit(1);
}

// --- is the server up? -------------------------------------------------------
try {
  const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`nothing answering at ${BASE} (${e.message}) — start the server first`);
  process.exit(1);
}

// --- minimal CDP client ------------------------------------------------------
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    const waiters = [];
    let seq = 0;

    ws.addEventListener("error", () => reject(new Error("websocket failed")));
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { res, rej, method } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(`${method}: ${msg.error.message} (${msg.error.code})`)) : res(msg.result);
      } else if (msg.method) {
        for (let i = waiters.length - 1; i >= 0; i--) {
          if (waiters[i].method === msg.method) {
            const w = waiters.splice(i, 1)[0];
            clearTimeout(w.timer);
            w.res(msg.params);
          }
        }
      }
    });
    ws.addEventListener("open", () =>
      resolve({
        send: (method, params = {}, sessionId) =>
          new Promise((res, rej) => {
            const m = { id: ++seq, method, params };
            if (sessionId) m.sessionId = sessionId;
            pending.set(m.id, { res, rej, method });
            ws.send(JSON.stringify(m));
          }),
        once: (method, ms = 30000) =>
          new Promise((res, rej) => {
            const timer = setTimeout(() => rej(new Error(`timeout: ${method}`)), ms);
            waiters.push({ method, res, timer });
          }),
        close: () => ws.close(),
      })
    );
  });
}

// --- launch ------------------------------------------------------------------
const profile = path.join(os.tmpdir(), `india-jobs-shots-${process.pid}`);
const child = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${VIEWPORT_H}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

let browser;
try {
  // wait for the debugging endpoint
  let version;
  for (let i = 0; i < 60; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) })).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version?.webSocketDebuggerUrl) throw new Error("chrome did not expose a debugging endpoint");

  browser = await connect(version.webSocketDebuggerUrl);
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const S = (m, p) => browser.send(m, p, sessionId);

  await S("Page.enable");
  await S("Runtime.enable");
  await S("Emulation.setDeviceMetricsOverride", {
    width: WIDTH, height: VIEWPORT_H, deviceScaleFactor: 1, mobile: false,
  });

  // one visit to the origin first, so localStorage is writable
  const warm = browser.once("Page.loadEventFired");
  await S("Page.navigate", { url: BASE + "/" });
  await warm;

  mkdirSync("docs", { recursive: true });

  for (const shot of SHOTS) {
    const nav = browser.once("Page.loadEventFired");
    await S("Page.navigate", { url: BASE + shot.path });
    await nav;

    await S("Runtime.evaluate", {
      expression:
        `document.documentElement.dataset.theme=${JSON.stringify(shot.theme)};` +
        `try{localStorage.setItem('theme',${JSON.stringify(shot.theme)})}catch(e){}`,
    });
    await sleep(500); // fonts, hydration, transitions

    const { cssContentSize } = await S("Page.getLayoutMetrics");
    const height = Math.min(Math.ceil(cssContentSize.height), MAX_H);
    await S("Emulation.setDeviceMetricsOverride", {
      width: WIDTH, height, deviceScaleFactor: 1, mobile: false,
    });
    await sleep(250);

    const { data } = await S("Page.captureScreenshot", { format: "png" });
    writeFileSync(path.join("docs", shot.file), Buffer.from(data, "base64"));
    console.log(`${shot.file.padEnd(22)} ${WIDTH}x${height}  ${shot.label}`);

    await S("Emulation.setDeviceMetricsOverride", {
      width: WIDTH, height: VIEWPORT_H, deviceScaleFactor: 1, mobile: false,
    });
  }
} finally {
  try { browser?.close(); } catch { /* ignore */ }
  child.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
