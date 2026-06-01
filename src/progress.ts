import { rewardDefaults } from "./data";

export interface AttemptRecord {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  attemptedAt: string;
}

export interface RewardRule {
  coins: number;
  reward: string;
}

export interface ProgressState {
  coins: number;
  streak: number;
  weekKey: string;
  completedQuestIds: string[];
  attempts: AttemptRecord[];
  rewardRules: RewardRule[];
}

export function getWeekKey(date = new Date()) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

const LEGACY_STORAGE_KEY = "ashwood-quest-progress-v1";
const STORAGE_KEY = "prehighschool-academy-progress-v1";

function createDefaultProgress(): ProgressState {
  return {
    coins: 0,
    streak: 0,
    weekKey: getWeekKey(),
    completedQuestIds: [],
    attempts: [],
    rewardRules: [
      { coins: 700, reward: "AU$5 Roblox gift card or equivalent cash reward" },
    ],
  };
}

export const defaultProgress: ProgressState = createDefaultProgress();

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function safeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function safeAttempts(value: unknown): AttemptRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((attempt): attempt is AttemptRecord => {
    return Boolean(
      attempt &&
        typeof attempt.questionId === "string" &&
        typeof attempt.selectedAnswer === "string" &&
        typeof attempt.correct === "boolean" &&
        typeof attempt.attemptedAt === "string",
    );
  });
}

function safeRewardRules(value: unknown): RewardRule[] {
  if (!Array.isArray(value)) return createDefaultProgress().rewardRules;
  const rules = value
    .filter((rule): rule is RewardRule => {
      return Boolean(rule && safeNumber(rule.coins) > 0 && typeof rule.reward === "string" && rule.reward.trim());
    })
    .map((rule) => ({ coins: rule.coins, reward: rule.reward.trim() }))
    .sort((a, b) => a.coins - b.coins);
  if (!rules.length || rules.some((rule) => rule.coins > 700)) return createDefaultProgress().rewardRules;
  return rules;
}

function readStoredProgress() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredProgress(progress: ProgressState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Some mobile browsers can deny storage in private mode. The app should still run for the session.
  }
}

export function loadProgress(): ProgressState {
  const raw = readStoredProgress();
  if (!raw) return createDefaultProgress();
  try {
    const parsed = JSON.parse(raw);
    const defaults = createDefaultProgress();
    const weekKey = getWeekKey();
    const isNewWeek = parsed.weekKey !== weekKey;
    const completedQuestIds = safeStringArray(parsed.completedQuestIds);
    return {
      ...defaults,
      coins: safeNumber(parsed.coins),
      streak: isNewWeek ? 0 : completedQuestIds.length,
      weekKey,
      completedQuestIds,
      attempts: safeAttempts(parsed.attempts),
      rewardRules: safeRewardRules(parsed.rewardRules),
    };
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: ProgressState) {
  writeStoredProgress({
    ...progress,
    coins: safeNumber(progress.coins),
    streak: safeNumber(progress.streak),
    weekKey: getWeekKey(),
    completedQuestIds: safeStringArray(progress.completedQuestIds),
    attempts: safeAttempts(progress.attempts),
    rewardRules: safeRewardRules(progress.rewardRules),
  });
}

export function calculateCoins(correctCount: number, total: number, questAlreadyCompleted: boolean) {
  if (questAlreadyCompleted) return 0;
  if (total === 0) return 0;
  return correctCount > 0 ? 100 : 0;
}
