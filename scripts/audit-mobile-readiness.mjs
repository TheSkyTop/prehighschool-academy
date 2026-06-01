import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

const issues = [];

if (!/viewport-fit=cover/.test(html)) issues.push("index.html should include viewport-fit=cover for iPad safe areas.");
if (!/apple-mobile-web-app-capable/.test(html)) issues.push("index.html should include apple-mobile-web-app-capable.");
if (!/apple-touch-icon/.test(html)) issues.push("index.html should include an apple-touch-icon.");
if (!/mobile-web-app-capable/.test(html)) issues.push("index.html should include mobile-web-app-capable.");

if (manifest.display !== "standalone") issues.push("manifest display should be standalone.");
if (!manifest.name || !manifest.short_name) issues.push("manifest should include name and short_name.");
if (!manifest.start_url) issues.push("manifest should include start_url.");
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) issues.push("manifest should include at least 192 and 512 icons.");
if (!manifest.icons?.some((icon) => icon.sizes?.includes("192"))) issues.push("manifest missing 192 icon.");
if (!manifest.icons?.some((icon) => icon.sizes?.includes("512"))) issues.push("manifest missing 512 icon.");

if (!/mode === "navigate"/.test(serviceWorker)) issues.push("service worker should handle navigation fallback.");
if (!/cache\.put/.test(serviceWorker)) issues.push("service worker should runtime-cache same-origin assets.");
if (!/prehighschool-logo\.svg/.test(serviceWorker)) issues.push("service worker should precache the academy logo.");
if (/\/manifest\.webmanifest/.test(serviceWorker)) issues.push("service worker should not precache the unhashed manifest path in production.");

if (!/100dvh/.test(styles)) issues.push("styles should use dynamic viewport height for mobile browser chrome.");
if (!/safe-area-inset-top/.test(styles)) issues.push("styles should respect iOS safe-area inset.");
if (!/@media \(pointer: coarse\)/.test(styles)) issues.push("styles should include touch-target rules.");
if (!/min-height:\s*44px/.test(styles)) issues.push("touch targets should be at least 44px.");

if (issues.length) {
  console.error("Mobile readiness issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Mobile readiness audit passed.");
