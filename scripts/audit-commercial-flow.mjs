import { readFileSync } from "node:fs";

const app = readFileSync("src/App.tsx", "utf8");
const progress = readFileSync("src/progress.ts", "utf8");

const requiredAppMarkers = [
  "const LIFETIME_ACCESS_AUD = 30",
  "const FREE_PREVIEW_WEEKS = 2",
  "type View = \"dashboard\" | \"knowledge\" | \"subjects\" | \"lesson\" | \"quiz\" | \"mistakes\" | \"rewards\" | \"parent\" | \"account\"",
  "Activate test access",
  "Stripe Checkout",
  "backend webhook",
  "Roblox AU$5",
  "AU$5 Pocket Money",
  "20 Minutes Screen Time",
  "Wish Card",
];

const requiredProgressMarkers = [
  "export type RewardPreference",
  "export type PaymentStatus",
  "userEmail: string",
  "paymentStatus: PaymentStatus",
  "selectedReward: RewardPreference",
];

const missing = [
  ...requiredAppMarkers.filter((marker) => !app.includes(marker)).map((marker) => `App.tsx: ${marker}`),
  ...requiredProgressMarkers
    .filter((marker) => !progress.includes(marker))
    .map((marker) => `progress.ts: ${marker}`),
];

if (missing.length) {
  console.error("Commercial flow audit failed:");
  for (const marker of missing) console.error(`- Missing ${marker}`);
  process.exit(1);
}

console.log("Commercial flow audit passed.");
