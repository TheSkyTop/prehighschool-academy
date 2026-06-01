import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/data.ts", import.meta.url), "utf8");

function objectBlocks(arrayName) {
  const start = source.indexOf(`export const ${arrayName}`);
  const end = source.indexOf(`export const`, start + 1);
  const slice = source.slice(start, end > -1 ? end : undefined);
  return slice
    .split(/\n  \{/)
    .slice(1)
    .map((block) => `  {${block}`);
}

function fieldValue(block, field) {
  return block.match(new RegExp(`${field}:\\s*"([^"]+)"`))?.[1] ?? "";
}

function textValue(block, field) {
  const start = block.indexOf(`${field}:`);
  if (start === -1) return "";
  const rest = block.slice(start);
  const matches = [...rest.matchAll(/"([^"]*)"/g)];
  return matches[0]?.[1] ?? "";
}

function numberValue(block, field) {
  const match = block.match(new RegExp(`${field}: ([0-9]+)`));
  return match ? Number(match[1]) : 0;
}

function arrayValues(block, field) {
  const match = block.match(new RegExp(`${field}: \\[([^\\]]*)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function hasArrayContent(block, field, minimum = 1) {
  return arrayValues(block, field).length >= minimum;
}

function hasNestedArray(block, field, minimum = 1) {
  const start = block.indexOf(`${field}: [`);
  if (start === -1) return false;
  const nextField = block.indexOf("\n    curriculumRefs:", start);
  const slice = block.slice(start, nextField === -1 ? undefined : nextField);
  return (slice.match(/\{/g) ?? []).length >= minimum;
}

function hasVerifiedVideo(block) {
  const start = block.indexOf("videoLinks: [");
  if (start === -1) return false;
  const nextField = block.indexOf("\n    curriculumRefs:", start);
  const slice = block.slice(start, nextField === -1 ? undefined : nextField);
  return /videoId:\s*"[^"]+"/.test(slice) && /qualityScore:\s*(9[0-9]|100)/.test(slice);
}

const lessons = new Map(objectBlocks("lessons").map((block) => [fieldValue(block, "id"), block]));
const questions = new Map(objectBlocks("questions").map((block) => [fieldValue(block, "id"), block]));
const quests = objectBlocks("weeklyQuests");
const issues = [];
const report = [];

for (const quest of quests) {
  const id = fieldValue(quest, "id");
  const day = fieldValue(quest, "day");
  const title = fieldValue(quest, "title");
  const lessonIds = arrayValues(quest, "lessonIds");
  const questionIds = arrayValues(quest, "questionIds");
  const questIssues = [];
  const expectedQuestions = fieldValue(quest, "subject") === "writing" ? 1 : 10;

  if (questionIds.length !== expectedQuestions) {
    questIssues.push(`expected ${expectedQuestions} direct question${expectedQuestions === 1 ? "" : "s"}, found ${questionIds.length}`);
  }
  if (lessonIds.length < 1) questIssues.push("missing lesson");

  for (const lessonId of lessonIds) {
    const lesson = lessons.get(lessonId);
    if (!lesson) {
      questIssues.push(`missing lesson ${lessonId}`);
      continue;
    }
    if (numberValue(lesson, "minutes") < 8) questIssues.push(`${lessonId}: lesson should be at least 8 minutes`);
    if (!hasArrayContent(lesson, "learningGoals", 2)) questIssues.push(`${lessonId}: weak learning goals`);
    if (!hasArrayContent(lesson, "keyIdeas", 3)) questIssues.push(`${lessonId}: weak key ideas`);
    if (!hasArrayContent(lesson, "coreConcepts", 2)) questIssues.push(`${lessonId}: weak core concepts`);
    if (!hasArrayContent(lesson, "commonTraps", 2)) questIssues.push(`${lessonId}: weak common traps`);
    if (!textValue(lesson, "workedExample") || !textValue(lesson, "secondDemo")) {
      questIssues.push(`${lessonId}: missing worked demo data`);
    }
    if (!lesson.includes("visualModel:")) questIssues.push(`${lessonId}: missing visual model`);
    if (!hasNestedArray(lesson, "videoLinks", 1)) questIssues.push(`${lessonId}: missing video support`);
    if (!hasVerifiedVideo(lesson)) questIssues.push(`${lessonId}: needs a verified embeddable YouTube video with 90+ fit`);
    if (textValue(lesson, "examStrategy").length < 80) questIssues.push(`${lessonId}: exam strategy too thin`);
  }

  for (const questionId of questionIds) {
    const question = questions.get(questionId);
    if (!question) {
      questIssues.push(`missing question ${questionId}`);
      continue;
    }
    if (textValue(question, "prompt").length < 20) questIssues.push(`${questionId}: prompt too short`);
    if (!textValue(question, "explanation")) questIssues.push(`${questionId}: missing explanation`);
    if (!hasArrayContent(question, "curriculumRefs", 1)) questIssues.push(`${questionId}: missing curriculum refs`);
    if (!hasArrayContent(question, "examStyle", 1)) questIssues.push(`${questionId}: missing exam style`);
    if (!hasArrayContent(question, "mistakeTags", 1)) questIssues.push(`${questionId}: missing mistake tags`);
    if (fieldValue(question, "type") !== "writing" && !hasArrayContent(question, "choices", 4)) {
      questIssues.push(`${questionId}: non-writing question needs 4 choices`);
    }
  }

  report.push({ day, title, lessons: lessonIds.length, questions: questionIds.length, issues: questIssues.length });
  for (const issue of questIssues) issues.push(`${day} ${title}: ${issue}`);
}

console.table(report);

if (issues.length) {
  console.error("\nCommercial audit issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nWeek 1 commercial audit passed.");
