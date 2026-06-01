import { readFile } from "node:fs/promises";

const dataSource = await readFile(new URL("../src/data.ts", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

const SUBJECTS = ["math", "reading", "language", "writing", "science", "physics", "reasoning"];
const DAILY_QUIZ_TARGET = 10;

function objectBlocks(source, arrayName) {
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
  return block.slice(start).match(/"([^"]*)"/)?.[1] ?? "";
}

function arrayValues(block, field) {
  const match = block.match(new RegExp(`${field}: \\[([^\\]]*)\\]`));
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function numberValue(block, field) {
  return Number(block.match(new RegExp(`${field}:\\s*([0-9]+)`))?.[1] ?? 0);
}

function hasVideo(block) {
  const start = block.indexOf("videoLinks: [");
  if (start === -1) return false;
  const nextField = block.indexOf("\n    curriculumRefs:", start);
  const slice = block.slice(start, nextField === -1 ? undefined : nextField);
  return /videoId:\s*"[^"]+"/.test(slice) && /qualityScore:\s*(9[0-9]|100)/.test(slice);
}

function hasVisualModel(block) {
  return /visualModel:\s*\{[\s\S]*kind:\s*"[^"]+"/.test(block);
}

const lessons = new Map(objectBlocks(dataSource, "lessons").map((block) => [fieldValue(block, "id"), block]));
const questions = new Map(objectBlocks(dataSource, "questions").map((block) => [fieldValue(block, "id"), block]));
const quests = objectBlocks(dataSource, "weeklyQuests");
const issues = [];
const report = [];

for (let week = 1; week <= 2; week += 1) {
  const weekQuests = quests.filter((quest) => fieldValue(quest, "id").includes(`week${week}-`));
  const subjectOrder = weekQuests.map((quest) => fieldValue(quest, "subject"));
  if (weekQuests.length !== 7) issues.push(`Week ${week}: expected 7 quests, found ${weekQuests.length}`);
  if (SUBJECTS.some((subject, index) => subjectOrder[index] !== subject)) {
    issues.push(`Week ${week}: subject order should be ${SUBJECTS.join(", ")}, found ${subjectOrder.join(", ")}`);
  }

  for (const quest of weekQuests) {
    const id = fieldValue(quest, "id");
    const subject = fieldValue(quest, "subject");
    const lessonIds = arrayValues(quest, "lessonIds");
    const questionIds = arrayValues(quest, "questionIds");
    const expectedTasks = subject === "writing" ? 1 : DAILY_QUIZ_TARGET;
    const questIssues = [];

    if (lessonIds.length !== 1) questIssues.push(`expected 1 lesson, found ${lessonIds.length}`);
    if (questionIds.length !== expectedTasks) questIssues.push(`expected ${expectedTasks} quiz task(s), found ${questionIds.length}`);

    for (const lessonId of lessonIds) {
      const lesson = lessons.get(lessonId);
      if (!lesson) {
        questIssues.push(`missing lesson ${lessonId}`);
        continue;
      }
      if (fieldValue(lesson, "subject") !== subject) questIssues.push(`${lessonId}: subject mismatch`);
      if (numberValue(lesson, "minutes") < 8) questIssues.push(`${lessonId}: lesson time too light`);
      if (arrayValues(lesson, "learningGoals").length < 3) questIssues.push(`${lessonId}: needs 3+ learning goals`);
      if (arrayValues(lesson, "keyIdeas").length < 4) questIssues.push(`${lessonId}: needs 4+ key ideas`);
      if (arrayValues(lesson, "coreConcepts").length < 3) questIssues.push(`${lessonId}: needs 3+ core concepts`);
      if (!textValue(lesson, "workedExample") || !textValue(lesson, "secondDemo")) questIssues.push(`${lessonId}: missing two demos`);
      if (!textValue(lesson, "quickCheck")) questIssues.push(`${lessonId}: missing quick check`);
      if (!textValue(lesson, "extensionPrompt")) questIssues.push(`${lessonId}: missing challenge prompt`);
      if (textValue(lesson, "examStrategy").length < 80) questIssues.push(`${lessonId}: exam strategy too short`);
      if (arrayValues(lesson, "commonTraps").length < 2) questIssues.push(`${lessonId}: needs common traps`);
      if (!hasVisualModel(lesson)) questIssues.push(`${lessonId}: missing visual model`);
      if (!hasVideo(lesson)) questIssues.push(`${lessonId}: missing verified 90+ videoId`);
    }

    for (const questionId of questionIds) {
      const question = questions.get(questionId);
      if (!question) {
        questIssues.push(`missing question ${questionId}`);
        continue;
      }
      if (fieldValue(question, "subject") !== subject) questIssues.push(`${questionId}: subject mismatch`);
      if (textValue(question, "prompt").length < 30) questIssues.push(`${questionId}: prompt too thin`);
      if (textValue(question, "explanation").length < 30) questIssues.push(`${questionId}: explanation too thin`);
      if (arrayValues(question, "curriculumRefs").length < 1) questIssues.push(`${questionId}: missing curriculum refs`);
      if (arrayValues(question, "examStyle").length < 1) questIssues.push(`${questionId}: missing exam style`);
      if (arrayValues(question, "mistakeTags").length < 1) questIssues.push(`${questionId}: missing mistake tags`);
      if (fieldValue(question, "type") === "writing") {
        if (!/100-200 word/i.test(textValue(question, "prompt"))) questIssues.push(`${questionId}: writing prompt needs 100-200 word target`);
      } else if (arrayValues(question, "choices").length !== 4) {
        questIssues.push(`${questionId}: multiple-choice task needs exactly 4 choices`);
      }
    }

    report.push({
      week,
      subject,
      lesson: lessonIds.length,
      quizTasks: questionIds.length,
      issues: questIssues.length,
    });
    for (const issue of questIssues) issues.push(`${id}: ${issue}`);
  }
}

for (const questId of ["quest-week1-day2", "quest-week2-day2"]) {
  const block = appSource.match(new RegExp(`"${questId}": \\[[\\s\\S]*?\\n  \\],`))?.[0] ?? "";
  const passageCount = (block.match(/title:\s*"Passage/g) ?? []).length;
  const fiveQuestionSets = [...block.matchAll(/questionIds:\s*\[([\s\S]*?)\]/g)].filter((match) => (match[1].match(/"/g) ?? []).length / 2 === 5).length;
  if (passageCount !== 2 || fiveQuestionSets !== 2) {
    issues.push(`${questId}: reading quiz should contain 2 passages with 5 questions each`);
  }
}

console.table(report);

if (issues.length) {
  console.error("\nTwo-week pilot audit issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nTwo-week pilot audit passed.");
