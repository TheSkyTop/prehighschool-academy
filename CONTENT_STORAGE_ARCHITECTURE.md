# Content Storage And Generation Architecture

## Product Goal

PreHighSchool Academy should eventually cover 52 weeks of Year 4-6 preparation across seven subjects:

- 364 daily topics.
- 3,640 core quiz questions.
- Visual learning models.
- Recommended videos.
- Mistake-bank review.
- Parent-controlled rewards.

The content system must be cheap to store, fast to load, safe for children, and easy to expand.

## Recommended Architecture

Use a hybrid model:

1. Store a compact curriculum knowledge graph permanently.
2. Generate weekly learning packs from the graph.
3. Cache and version approved weekly packs.
4. Serve only approved packs to the app.
5. Store child progress separately from content.

Do not scrape live web content directly inside the child app.

## Data Layers

### 1. Curriculum Graph

Small, permanent, versioned.

Stores:

- Subject.
- Strand.
- Topic.
- Difficulty.
- Prerequisites.
- Curriculum tags.
- Exam relevance.
- Recommended visual model type.
- Quiz blueprint type.
- Video search keywords and approved channel preferences.

This layer is tiny: hundreds of nodes, not thousands of full lessons.

### 2. Content Templates

Small, permanent, reusable.

Stores:

- Lesson section structure.
- Quiz blueprint.
- Rubric rules.
- Difficulty rules.
- Explanation style rules.
- Safety and age-fit rules.

Example quiz template:

```json
{
  "id": "math-percent-selective",
  "questions": [
    "recall",
    "formula-language",
    "basic-application",
    "visual-model",
    "word-problem",
    "multi-step",
    "trap-check",
    "data-or-diagram",
    "timed-challenge",
    "boss-question"
  ]
}
```

### 3. Approved Weekly Pack

Generated, cached, versioned.

Stores:

- Seven daily topics.
- Learning content.
- Ten quiz questions per day.
- Answer keys.
- Explanations.
- Visual model data.
- Video candidates.
- Content hash.
- QA status.

The app downloads only the current approved weekly pack and optional next-week preview.

### 4. Progress Store

Separate from content.

Stores:

- Completed quests.
- Points.
- Streak.
- Quiz attempts.
- Mistake tags.
- Parent reward settings.

This allows content updates without corrupting progress.

## Minimal Storage Design

Avoid storing duplicated text where possible.

Store:

- Topic node IDs.
- Template IDs.
- Approved generated pack JSON.
- Version hash.
- Small diagram data.
- YouTube metadata, not video files.

Do not store:

- Raw YouTube video files.
- Full scraped web pages.
- Duplicate copies of the same generated content.
- Large raster diagrams when SVG/HTML/CSS can represent them.

## Dynamic Generation Workflow

### Weekly Server Job

1. Select seven topic nodes for the target week.
2. Load lesson template and quiz blueprint for each topic.
3. Generate learning content and quiz questions.
4. Generate diagram data as structured JSON.
5. Rank approved video candidates.
6. Run automated QA checks.
7. Save as `WeeklyPack`.
8. Mark as `DRAFT`, `REVIEWED`, or `APPROVED`.

### QA Checks

Automated checks should verify:

- Exactly 10 questions per topic.
- Every question has answer and explanation.
- No answer is ambiguous.
- Difficulty matches target Year 4-6 band.
- No adult, unsafe, or investment-advice content.
- Video candidate is relevant and free.
- Reading passages are original or public-domain/adapted.
- Writing prompts avoid private personal information.

### Human Review

For commercial release, the first 8-12 weeks should be human-reviewed. Later weeks can be generated faster once templates prove reliable.

## Why Not Live Scraping?

Live scraping sounds cheap but is risky:

- Pages change.
- Copyright status is unclear.
- Content can be inappropriate.
- Video embeds can break.
- Network latency hurts UX.
- It is hard to QA before a child sees it.

Better approach:

- Use web research during content production.
- Cache only approved metadata and original lesson content.
- Use source links and video candidates as references.
- Do not depend on live web pages during a child's lesson.

## Suggested Pack Shape

```ts
type WeeklyPack = {
  id: string;
  week: number;
  status: "DRAFT" | "REVIEWED" | "APPROVED";
  version: string;
  generatedAt: string;
  topics: DailyTopic[];
};

type DailyTopic = {
  id: string;
  subject: SubjectId;
  title: string;
  strand: string;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  curriculumRefs: string[];
  lesson: GeneratedLesson;
  quiz: GeneratedQuestion[];
  visual: VisualModelData;
  videos: VideoCandidate[];
};
```

## Cost Optimisation

Use these rules:

- Generate one week at a time, not all 52 weeks on every update.
- Cache approved packs permanently by hash.
- Regenerate only changed topic nodes or templates.
- Store diagrams as data, not images.
- Use YouTube embed IDs, not hosted video files.
- Compress weekly packs with Brotli/Gzip.
- Lazy-load lesson content only when the child opens a day.

## Algorithm Optimisation

Topic selection should use:

- Prerequisite order.
- Spaced review.
- Difficulty progression.
- Mistake-bank feedback.
- Exam-weighted topic priority.

Weekly pack generation should balance:

- 70% core curriculum.
- 20% selective/scholarship extension.
- 10% challenge/enrichment.

Daily quiz should balance:

- 30% recall and fluency.
- 30% application.
- 20% diagram/data/passage interpretation.
- 10% common traps.
- 10% challenge.

## Child Safety Rule

Children should only see approved weekly packs. Generation and web search belong on the server or editor side, never as uncontrolled live content in the child-facing app.
