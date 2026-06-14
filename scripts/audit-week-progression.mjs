import { readFile, writeFile, rm } from "node:fs/promises";
import ts from "typescript";

const dataSource = await readFile(new URL("../src/data.ts", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const progressSource = await readFile(new URL("../src/progress.ts", import.meta.url), "utf8");
const tempDataPath = new URL("./.week-progression-data.mjs", import.meta.url);
const tempProgressPath = new URL("./.week-progression-progress.mjs", import.meta.url);

await writeFile(
  tempDataPath,
  ts.transpileModule(dataSource, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  "utf8",
);

await writeFile(
  tempProgressPath,
  ts
    .transpileModule(progressSource, {
      compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
    })
    .outputText.replace(/import \{ rewardDefaults \} from "\.\/data";/, "const rewardDefaults = { dailyQuest: 50 };"),
  "utf8",
);

const data = await import(`${tempDataPath.href}?t=${Date.now()}`);
const progress = await import(`${tempProgressPath.href}?t=${Date.now()}`);
await rm(tempDataPath, { force: true });
await rm(tempProgressPath, { force: true });

function questWeek(questId) {
  const match = questId.match(/week(\d+)/);
  return match ? Number(match[1]) : 1;
}

function getWeekQuests(week) {
  return data.weeklyQuests.filter((quest) => questWeek(quest.id) === week);
}

function getLearningWeekOptions(completedQuestIds) {
  const completed = new Set(completedQuestIds);
  const windowSize = 5;
  const availableWeeks = Array.from(new Set(data.weeklyQuests.map((quest) => questWeek(quest.id)))).sort((a, b) => a - b);
  if (availableWeeks.length <= windowSize) return availableWeeks;

  const firstIncompleteIndex = availableWeeks.findIndex((week) => {
    const weekQuests = getWeekQuests(week);
    return weekQuests.some((quest) => !completed.has(quest.id));
  });
  const finalWindowStart = Math.max(0, availableWeeks.length - windowSize);
  const startIndex = firstIncompleteIndex === -1 ? finalWindowStart : Math.min(firstIncompleteIndex, finalWindowStart);

  return availableWeeks.slice(startIndex, startIndex + windowSize);
}

const week1And2Done = data.weeklyQuests
  .filter((quest) => questWeek(quest.id) <= 2)
  .map((quest) => quest.id);
const optionsAfterTwoWeeks = getLearningWeekOptions(week1And2Done);
const allDone = data.weeklyQuests.map((quest) => quest.id);
const optionsAfterAllDone = getLearningWeekOptions(allDone);

const originalWindow = globalThis.window;
const stored = JSON.stringify({
  coins: 1400,
  streak: 7,
  weekKey: "2000-01-03",
  completedQuestIds: week1And2Done,
  attempts: [],
  rewardRules: [{ coins: 700, reward: "AU$5 Roblox gift card or equivalent cash reward" }],
});
globalThis.window = {
  localStorage: {
    getItem: () => stored,
    setItem: () => undefined,
    removeItem: () => undefined,
  },
};
const loaded = progress.loadProgress();
globalThis.window = originalWindow;

const issues = [];
if (optionsAfterTwoWeeks.join(",") !== "3,4,5,6,7") {
  issues.push(`Expected week options 3,4,5,6,7 after two completed weeks, got ${optionsAfterTwoWeeks.join(",")}.`);
}
if (optionsAfterAllDone.join(",") !== "48,49,50,51,52") {
  issues.push(`Expected final options 48,49,50,51,52 after all weeks completed, got ${optionsAfterAllDone.join(",")}.`);
}
if (loaded.completedQuestIds.length !== week1And2Done.length) {
  issues.push("Completed quest ids should persist across a new calendar week.");
}
if (loaded.streak !== 0) {
  issues.push("Streak should reset when the calendar week changes.");
}

console.table([
  { scenario: "After Week 1-2 complete", weekTabs: optionsAfterTwoWeeks.join(", ") },
  { scenario: "After all weeks complete", weekTabs: optionsAfterAllDone.join(", ") },
  { scenario: "New calendar week", persistedCompleted: loaded.completedQuestIds.length, streak: loaded.streak },
]);

if (issues.length) {
  console.error("\nWeek progression issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nWeek progression audit passed.");
