# PreHighSchool Academy - Product Specification

## Product Positioning

PreHighSchool Academy is an English-language learning app for Year 4 to Year 6 students preparing for highschool readiness and broader Australian selective, high-ability, and scholarship pathways. The first release is designed as a commercial-grade Web/PWA app that works on desktop, Android phones, Android tablets, and iPad. Native mobile apps can follow after product validation.

## Release Goal

Version 1 should feel like a publishable learning product, not a demo. Future work should mainly add curriculum content, question volume, harder levels, videos, and richer analytics without rebuilding the core learning system.

## Curriculum Scope

The learning structure is Australia-first, with public US and UK curriculum alignment used as enrichment.

- Australia: Australian Curriculum v9, NAPLAN-style literacy/numeracy, ACER/HAST/scholarship style reasoning.
- United States: Common Core style mathematics and English language arts, NGSS science practices and disciplinary ideas.
- United Kingdom: England Key Stage 2 English, mathematics, science, and 11+ style verbal/non-verbal reasoning.
- Global challenge layer: advanced primary-to-lower-secondary bridge questions inspired by international middle-school readiness and high-achievement preparation.

The app must not copy real exam questions or copyrighted passages. Content should be original, with metadata showing the style and standards it supports.

## Platforms

- Primary V1: Responsive web app.
- Android V1: Installable PWA with offline cached shell and local progress storage.
- Desktop V1: Browser-based testing and parent review.
- Future: Native Android using the same content schema.

## User Roles

### Student

The student completes daily learning quests, quizzes, challenge tasks, writing practice, mock tests, and mistake review.

### Parent

The parent reviews progress, configures virtual rewards, checks weak areas, and chooses weekly focus.

### Content Admin

The first release may keep admin tooling hidden or file-based. The data schema must support future content management.

## Core Navigation

- Student Dashboard
- Subjects
- Learning Path
- Lesson
- Quiz
- Results
- Mistake Bank
- Mock Tests
- Writing Practice
- Rewards
- Parent Dashboard
- Parent Settings

## Commercial V1 Functional Requirements

### Student Dashboard

The dashboard should show:

- Today&apos;s Quest
- Current coins
- Streak
- Weekly completion
- Subject progress
- Weak areas
- Next recommended task
- Active badges

### Learning Path

Every subject uses the same progression model:

- Foundation
- Core
- Extension
- Selective
- Scholarship Challenge
- Global Challenge

The app should recommend tasks based on completion, accuracy, and missed skills.

### Quiz Engine

The V1 quiz engine must support:

- Multiple choice
- Multi-select
- Short answer
- Ordering
- Matching
- Cloze passage
- Reading comprehension set
- Data interpretation
- Timed challenge
- Writing prompt

The initial implementation can render the most important types first, but the data model must support all types.

### Feedback

Each objective question must include:

- Correct answer
- Explanation
- Skill tag
- Difficulty
- Mistake tags

Feedback should be clear enough for an advanced Year 4 student and useful enough for a Year 6 student preparing for extension exams.

### Mistake Bank

The app records:

- Incorrect questions
- Attempts
- Last attempted date
- Mistake category
- Topic and subtopic
- Whether the question has been mastered later

### Mock Test Mode

V1 should support:

- Subject mock
- Mixed selective-style mock
- Scholarship challenge mock
- Timed section behaviour
- Score report
- Topic breakdown

### Rewards

Coins are virtual. The app does not process payments.

Default rule:

- Daily Quest completed: +50 coins
- Accuracy 80% or higher: +30 coins
- Perfect quiz: +50 coins
- Mistake review completed: +20 coins
- Weekly streak: +200 coins
- Mock test completed: +100 coins
- Challenge badge earned: +100 coins

Parent-configurable examples:

- 1000 coins = $10 family reward
- 1500 coins = book reward
- 2000 coins = weekend activity

### Parent Dashboard

The parent dashboard should show:

- Weekly study time
- Completion rate
- Accuracy by subject
- Weakest topics
- Coins balance
- Reward settings
- Suggested weekly focus

### Privacy and Child Safety

V1 should avoid public leaderboards and social features. Profiles can be local in the first release. If cloud accounts are added later, parental consent and child privacy requirements must be reviewed before launch.

## Data Model Requirements

The content and progress schema must include:

- Subject
- Topic
- Subtopic
- Lesson
- Question
- Answer
- Explanation
- Difficulty
- Year band
- Curriculum references
- Exam style
- Skill type
- Estimated time
- Calculator allowed
- Mistake tags
- Student attempt history
- Reward rule
- Badge
- Daily plan

## V1 Content Target

Commercial target:

- 7 subject modules
- 60-day learning path
- 1,500 original questions
- 120 mini lessons
- 180 worked examples
- 50 reading passages
- 30 science data sets
- 80 writing prompts
- 12 mock tests

Early build target:

- Complete data structure
- Representative seed content for every subject
- Fully working learning loop
- Clear path to bulk content loading

## Quality Bar

Before a V1 release candidate:

- Works on desktop, mobile, and tablet widths.
- Can be installed as PWA on Android.
- Saves progress locally.
- Has no blocking layout issues.
- Every quiz answer has feedback.
- Rewards are configurable by parent.
- Mistake Bank is functional.
- Progress report is understandable.
- Content can be expanded without code rewrites.
