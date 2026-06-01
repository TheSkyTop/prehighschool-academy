import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/data.ts", import.meta.url), "utf8");
const DAILY_QUIZ_TARGET = 10;

function collectIds(prefix) {
  return new Set([...source.matchAll(new RegExp(`id: "${prefix}[^"]+"`, "g"))].map((match) => match[0].slice(5, -1)));
}

function arrayValues(block, field) {
  const match = block.match(new RegExp(`${field}: \\[([^\\]]*)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function fieldValue(block, field) {
  return block.match(new RegExp(`${field}: "([^"]+)"`))?.[1] ?? "";
}

function objectBlocks(arrayName) {
  const start = source.indexOf(`export const ${arrayName}`);
  const end = source.indexOf(`export const`, start + 1);
  const slice = source.slice(start, end > -1 ? end : undefined);
  return slice
    .split(/\n  \{/)
    .slice(1)
    .map((block) => `  {${block}`);
}

const lessonIds = collectIds("lesson-");
const questionIds = collectIds("q-");
const questionBlocks = objectBlocks("questions");
const questionSubjects = new Map();

for (const block of questionBlocks) {
  const id = fieldValue(block, "id");
  const subject = fieldValue(block, "subject");
  if (id && subject) {
    if (!questionSubjects.has(subject)) questionSubjects.set(subject, []);
    questionSubjects.get(subject).push(id);
  }
}

const questBlocks = objectBlocks("weeklyQuests");
const issues = [];
const warnings = [];

for (const block of questBlocks) {
  const id = fieldValue(block, "id");
  const subject = fieldValue(block, "subject");
  const title = fieldValue(block, "title");
  const lessons = arrayValues(block, "lessonIds");
  const directQuestions = arrayValues(block, "questionIds");
  const relatedQuestions = questionSubjects.get(subject) ?? [];
  const effectiveQuestions = new Set([...directQuestions, ...relatedQuestions]).size;
  const expectedDirectQuestions = subject === "writing" ? 1 : DAILY_QUIZ_TARGET;

  for (const lessonId of lessons) {
    if (!lessonIds.has(lessonId)) issues.push(`${id}: missing lesson ${lessonId}`);
  }

  for (const questionId of directQuestions) {
    if (!questionIds.has(questionId)) issues.push(`${id}: missing question ${questionId}`);
  }

  if (directQuestions.length < expectedDirectQuestions) {
    warnings.push(`${id}: ${title} has ${directQuestions.length} direct questions; expected ${expectedDirectQuestions}.`);
  }

  if (subject !== "writing" && effectiveQuestions < DAILY_QUIZ_TARGET) {
    issues.push(`${id}: only ${effectiveQuestions} effective questions available for ${subject}; need ${DAILY_QUIZ_TARGET}`);
  }
}

console.log(`Checked ${questBlocks.length} quests, ${lessonIds.size} lessons, ${questionIds.size} questions.`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (issues.length) {
  console.error("\nContent issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nContent integrity check passed.");
