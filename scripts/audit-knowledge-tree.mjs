import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const start = source.indexOf("const knowledgeScope = [");
const end = source.indexOf("function App()", start);
const slice = source.slice(start, end);

const subjectBlocks = slice
  .split(/\n  \{\n    subject: "/)
  .slice(1)
  .map((block) => `"${block}`);

const issues = [];
const report = [];

for (const block of subjectBlocks) {
  const subject = block.match(/^"([^"]+)"/)?.[1] ?? "Unknown";
  const leaves = [...block.matchAll(/"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => {
      const excluded = [subject, "A 52-topic", "Number Fluency", "Proportion", "Algebra & Space", "Data & Exams"];
      return !excluded.includes(value) && !value.includes("52-topic") && !value.includes("sequence") && !value.includes("program") && !value.includes("pathway") && !value.includes("framework");
    });

  const branchNames = [...block.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);
  const topics = [...block.matchAll(/leaves: \[([\s\S]*?)\]/g)].flatMap((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
  );
  const duplicates = topics.filter((topic, index) => topics.indexOf(topic) !== index);

  report.push({ subject, branches: branchNames.length, topics: topics.length, duplicates: duplicates.length });

  if (branchNames.length !== 4) issues.push(`${subject}: expected 4 branches, found ${branchNames.length}`);
  if (topics.length !== 52) issues.push(`${subject}: expected 52 topics, found ${topics.length}`);
  if (duplicates.length) issues.push(`${subject}: duplicate topics: ${[...new Set(duplicates)].join(", ")}`);
}

console.table(report);

if (issues.length) {
  console.error("\nKnowledge tree issues:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("\nKnowledge tree audit passed.");
