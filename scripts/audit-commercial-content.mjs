import { readFile, writeFile, rm } from "node:fs/promises";
import ts from "typescript";

const sourcePath = new URL("../src/data.ts", import.meta.url);
const appPath = new URL("../src/App.tsx", import.meta.url);
const tempPath = new URL("./.commercial-content-audit-data.mjs", import.meta.url);
const tempKnowledgePath = new URL("./.commercial-content-audit-knowledge.mjs", import.meta.url);
const source = await readFile(sourcePath, "utf8");
const appSource = await readFile(appPath, "utf8");

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2020,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

await writeFile(tempPath, transpiled, "utf8");
const data = await import(`${tempPath.href}?t=${Date.now()}`);
await rm(tempPath, { force: true });

function extractConstArray(sourceText, constName) {
  const start = sourceText.indexOf(`const ${constName} = [`);
  if (start === -1) throw new Error(`Could not find ${constName}.`);
  const arrayStart = sourceText.indexOf("[", start);
  let depth = 0;
  for (let index = arrayStart; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return sourceText.slice(arrayStart, index + 1);
  }
  throw new Error(`Could not parse ${constName}.`);
}

const knowledgeModule = `export default ${extractConstArray(appSource, "knowledgeScope")};`;
await writeFile(tempKnowledgePath, knowledgeModule, "utf8");
const { default: knowledgeTree } = await import(`${tempKnowledgePath.href}?t=${Date.now()}`);
await rm(tempKnowledgePath, { force: true });

const { lessons, questions, weeklyQuests } = data;

const issues = [];
const warnings = [];
const promptOwners = new Map();
const questionById = new Map(questions.map((question) => [question.id, question]));
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const usedLessonIds = new Set(weeklyQuests.flatMap((quest) => quest.lessonIds));
const usedQuestionIds = new Set(weeklyQuests.flatMap((quest) => quest.questionIds));
const subjectIdByLabel = new Map([
  ["Maths", "math"],
  ["Reading", "reading"],
  ["English", "language"],
  ["Writing", "writing"],
  ["Science", "science"],
  ["Physics", "physics"],
  ["Reasoning", "reasoning"],
]);
const topicSetBySubject = new Map(
  knowledgeTree.map((subject) => [
    subjectIdByLabel.get(subject.subject),
    new Set(subject.branches.flatMap((branch) => branch.leaves.map((topic) => compact(topic)))),
  ]),
);
const topicAliases = new Map(
  Object.entries({
    "science::variables & fair testing": ["independent variables", "dependent variables", "control variables", "fair testing"],
    "science::data, tables & graphs": ["tables", "bar graphs", "line graphs", "scientific conclusions"],
    "science::adaptations and ecosystems": ["adaptations", "habitats", "food chains", "ecosystems"],
    "science::biology: ecosystems": ["ecosystems", "food chains", "food webs"],
    "language::sentence correction": ["subject-verb agreement", "grammar editing", "editing for clarity"],
    "language::cloze passages": ["cloze by grammar", "cloze by meaning", "cause connectives", "contrast connectives"],
    "language::vocabulary roots and word choice": ["prefixes", "suffixes", "greek roots", "latin roots", "word forms"],
    "language::prefixes, suffixes & roots": ["prefixes", "suffixes", "greek roots", "latin roots", "word forms"],
    "writing::persuasive planning": ["position statements", "planning reasons", "planning evidence", "persuasive writing"],
    "writing::narrative structure": ["story mountain", "story premise", "narrative writing", "orientation"],
    "writing::narrative planning": ["story mountain", "story premise", "narrative writing", "orientation"],
    "physics::forces": ["balanced forces", "unbalanced forces", "friction", "force diagrams"],
    "physics::energy": ["energy stores", "energy transfer"],
    "physics::energy, light, and sound": ["energy transfer", "light reflection", "sound vibrations"],
    "math::patterns & sequences": ["number patterns", "function machines"],
    "math::fractions, decimals & percentages": ["fraction equivalence", "comparing fractions", "percent meaning", "ratio tables"],
    "math::ratio and fraction comparison": ["fraction equivalence", "comparing fractions", "ratio tables"],
    "reading::non-fiction reading": ["text features", "science article", "news report"],
    "reading::main idea & theme": ["main idea", "theme", "author purpose"],
    "reading::main idea and author purpose": ["main idea", "author purpose"],
    "reasoning::number sequences": ["number sequences", "sequence rules", "alternating patterns"],
    "reasoning::verbal analogies": ["analogies", "word relationships"],
    "reasoning::logic puzzles": ["deduction grids", "truth statements", "ordering puzzles"],
    "reasoning::matrix reasoning": ["shape matrices", "rotation", "reflection"],
    "reasoning::matrix and spatial reasoning": ["shape matrices", "rotation", "reflection"],
  }).map(([key, values]) => [key, values.map(compact)]),
);

function topicExists(subject, topic) {
  const treeTopics = topicSetBySubject.get(subject);
  if (!treeTopics) return false;
  const topicKey = compact(topic);
  if (treeTopics.has(topicKey)) return true;
  const aliases = topicAliases.get(`${subject}::${topicKey}`) ?? [];
  return aliases.some((alias) => treeTopics.has(alias));
}

function compact(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function includesChoice(choices, answer) {
  const choiceSet = new Set(choices.map(compact));
  if (Array.isArray(answer)) return answer.every((item) => choiceSet.has(compact(item)));
  return choiceSet.has(compact(answer));
}

for (const lesson of lessons) {
  if (!topicExists(lesson.subject, lesson.topic)) {
    issues.push(`${lesson.id}: topic "${lesson.topic}" is not in the ${lesson.subject} knowledge tree.`);
  }

  if (!lesson.title || !lesson.summary) issues.push(`${lesson.id}: missing title or summary.`);
  if ((lesson.learningGoals ?? []).length < 3) warnings.push(`${lesson.id}: fewer than 3 learning goals.`);
  if ((lesson.keyIdeas ?? []).length < 4) warnings.push(`${lesson.id}: fewer than 4 key ideas.`);
  if ((lesson.coreConcepts ?? []).length < 3) warnings.push(`${lesson.id}: fewer than 3 core concepts.`);
  if (!lesson.workedExample || !lesson.secondDemo) issues.push(`${lesson.id}: missing two worked demos.`);
  if (!lesson.quickCheck || !lesson.extensionPrompt) issues.push(`${lesson.id}: missing quick check or extension prompt.`);
  if ((lesson.examStrategy ?? "").length < 90) warnings.push(`${lesson.id}: exam strategy may be too brief.`);
  if ((lesson.commonTraps ?? []).length < 2) warnings.push(`${lesson.id}: fewer than 2 common traps.`);
  if (!lesson.visualModel?.kind || !lesson.visualModel?.caption) issues.push(`${lesson.id}: missing visual model.`);
  if (!lesson.videoLinks?.some((video) => video.videoId && video.qualityScore >= 90)) {
    issues.push(`${lesson.id}: missing approved embeddable YouTube video with qualityScore >= 90.`);
  }
}

for (const question of questions) {
  const promptKey = compact(question.prompt);
  if (promptOwners.has(promptKey)) {
    issues.push(`${question.id}: duplicate prompt with ${promptOwners.get(promptKey)}.`);
  }
  promptOwners.set(promptKey, question.id);

  if (!topicExists(question.subject, question.topic)) {
    issues.push(`${question.id}: topic "${question.topic}" is not in the ${question.subject} knowledge tree.`);
  }

  if (!question.prompt || question.prompt.length < 25) warnings.push(`${question.id}: prompt may be too short.`);
  if (!question.explanation || question.explanation.length < 35) warnings.push(`${question.id}: explanation may be too short.`);
  if (!(question.mistakeTags ?? []).length) issues.push(`${question.id}: missing mistake tags.`);
  if (!(question.examStyle ?? []).length) issues.push(`${question.id}: missing exam style tags.`);

  if (question.type === "writing") {
    if (!/100-200/i.test(question.prompt)) issues.push(`${question.id}: writing task must show 100-200 word target.`);
  } else {
    if (!Array.isArray(question.choices) || question.choices.length !== 4) {
      issues.push(`${question.id}: non-writing question must have exactly 4 choices.`);
      continue;
    }
    if (new Set(question.choices.map(compact)).size !== question.choices.length) {
      issues.push(`${question.id}: duplicate answer choices.`);
    }
    if (!includesChoice(question.choices, question.correctAnswer)) {
      issues.push(`${question.id}: correct answer is not present in choices.`);
    }
  }
}

for (const quest of weeklyQuests) {
  const expectedQuestionCount = quest.subject === "writing" ? 1 : 10;
  if (quest.questionIds.length !== expectedQuestionCount) {
    issues.push(`${quest.id}: expected ${expectedQuestionCount} quiz task(s), found ${quest.questionIds.length}.`);
  }
  if (quest.lessonIds.length !== 1) issues.push(`${quest.id}: expected exactly one lesson.`);

  for (const lessonId of quest.lessonIds) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) issues.push(`${quest.id}: missing lesson ${lessonId}.`);
    if (lesson && lesson.subject !== quest.subject) issues.push(`${quest.id}: lesson subject mismatch for ${lessonId}.`);
  }

  for (const questionId of quest.questionIds) {
    const question = questionById.get(questionId);
    if (!question) issues.push(`${quest.id}: missing question ${questionId}.`);
    if (question && question.subject !== quest.subject) issues.push(`${quest.id}: question subject mismatch for ${questionId}.`);
  }
}

for (const lesson of lessons) {
  if (!usedLessonIds.has(lesson.id)) issues.push(`${lesson.id}: lesson is not attached to any daily quest.`);
}

for (const question of questions) {
  if (!usedQuestionIds.has(question.id)) issues.push(`${question.id}: question is not attached to any daily quest.`);
}

console.table(
  knowledgeTree.map((subject) => ({
    subject: subject.subject,
    topics: subject.branches.reduce((total, branch) => total + branch.leaves.length, 0),
  })),
);
console.log(`Checked ${lessons.length} lessons, ${questions.length} questions, ${weeklyQuests.length} quests.`);

if (warnings.length) {
  console.log("\nCommercial QA warnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (issues.length) {
  console.error("\nCommercial QA issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nCommercial content audit passed.");
