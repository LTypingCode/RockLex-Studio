import { app as o, BrowserWindow as t } from "electron";
import { createRequire as a } from "node:module";
import { fileURLToPath as c } from "node:url";
import e from "node:path";
a(import.meta.url);
const r = e.dirname(c(import.meta.url));
process.env.APP_ROOT = e.join(r, "..");
const i = process.env.VITE_DEV_SERVER_URL, _ = e.join(process.env.APP_ROOT, "dist-electron"), s = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? e.join(process.env.APP_ROOT, "public") : s;
let n;
function l() {
  n = new t({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    titleBarStyle: "hidden",
    minWidth: 400,
    minHeight: 250,
    webPreferences: {
      preload: e.join(r, "preload.js")
    }
  }), n.setMenu(null), n.webContents.on("did-finish-load", () => {
    n?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? n.loadURL(i) : n.loadFile(e.join(s, "index.html"));
}
o.on("window-all-closed", () => {
  process.platform !== "darwin" && (o.quit(), n = null);
});
o.on("activate", () => {
  t.getAllWindows().length === 0 && l();
});
o.whenReady().then(l);
export {
  _ as MAIN_DIST,
  s as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
