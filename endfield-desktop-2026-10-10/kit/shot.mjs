// kit/shot.sh <page.html[?query]> <out.png> [waitMs=3000] [evalExpr]   (wrapper: runs this with Windows node.exe)
// Real-time 1920x1080 screenshot: launches Windows Edge headless, drives it over CDP
// (rAF ticks normally - unlike --screenshot/--virtual-time-budget, which freezes tweens on frame 1).
// evalExpr runs right after load (e.g. "swapTo(2)"); add ?slow=10 to the url for mid-motion frames.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const [target, out, waitMs = "3000", evalExpr = ""] = process.argv.slice(2);
if (!target || !out) {
  console.error("usage: node kit/shot.mjs <page.html|url> <out.png> [waitMs] [evalExpr]");
  process.exit(2);
}
const url = target; // shot.sh hands over a file:/// URL

const chrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "efshot-"));
const proc = spawn(chrome, [
  "--headless=new", "--no-first-run", "--hide-scrollbars", "--mute-audio",
  "--allow-file-access-from-files", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--window-size=1920,1080", "about:blank",
], { stdio: "ignore" });
const quit = async (code) => {
  proc.kill();
  for (let i = 0; i < 20; i++) { // Edge holds the profile a moment after exit
    try { fs.rmSync(profile, { recursive: true, force: true }); break; }
    catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  process.exit(code);
};
setTimeout(() => { console.error("timeout"); quit(1); }, 60000 + +waitMs);

let ver;
for (let i = 0; i < 100 && !ver; i++) {
  try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); }
  catch { await new Promise((r) => setTimeout(r, 100)); }
}
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const waiters = new Map();
const evWaiters = [];
const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data.toString());
  if (d.id && waiters.has(d.id)) { waiters.get(d.id)(d); waiters.delete(d.id); return; }
  if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
  const i = evWaiters.findIndex((w) => w.name === d.method);
  if (i >= 0) evWaiters.splice(i, 1)[0].res(d);
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; waiters.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = (name) => new Promise((res) => evWaiters.push({ name, res }));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
const loaded = ev("Page.loadEventFired");
await send("Page.navigate", { url });
await loaded;
if (evalExpr) {
  const r = await send("Runtime.evaluate", { expression: evalExpr, returnByValue: true, awaitPromise: true });
  console.log("eval:", JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.text ?? null));
}
await new Promise((r) => setTimeout(r, +waitMs));
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
console.log("wrote", out);
if (errors.length) console.log("page errors:\n  " + errors.join("\n  "));
quit(0);
