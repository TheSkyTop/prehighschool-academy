import { Children, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { lessons, questions, subjects, weeklyQuests, type DailyQuest, type Lesson, type Question, type SubjectId } from "./data";
import {
  calculateCoins,
  loadProgress,
  saveProgress,
  type AttemptRecord,
  type ProgressState,
  type RewardPreference,
} from "./progress";

type View = "dashboard" | "knowledge" | "subjects" | "lesson" | "quiz" | "mistakes" | "rewards" | "parent" | "account";

const lessonMap = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const questionMap = new Map(questions.map((question) => [question.id, question]));
const DAILY_QUIZ_TARGET = 10;
const QUIZ_SECONDS = 20 * 60;
const YEAR_WEEKS = 52;
const LIFETIME_ACCESS_AUD = 30;
const FREE_PREVIEW_WEEKS = 2;

const rewardOptions: Array<{ id: RewardPreference; title: string; shortTitle: string; detail: string }> = [
  {
    id: "roblox",
    title: "Roblox AU$5",
    shortTitle: "Roblox",
    detail: "Parent-approved Roblox credit after a complete 700-point week.",
  },
  {
    id: "cash",
    title: "AU$5 Pocket Money",
    shortTitle: "Pocket Money",
    detail: "A simple cash-equivalent reward controlled by the parent.",
  },
  {
    id: "screen-time",
    title: "20 Minutes Screen Time",
    shortTitle: "Screen Time",
    detail: "One short TV, game, or screen-time session after weekly goals.",
  },
  {
    id: "wish-card",
    title: "Wish Card",
    shortTitle: "Wish Card",
    detail: "One child-chosen small wish card, approved by the parent.",
  },
];

type ReadingPassageSet = {
  title: string;
  text: string;
  questionIds: string[];
};

const readingQuizPassages: Record<string, ReadingPassageSet[]> = {
  "quest-week1-day2": [
    {
      title: "Passage A: The Hidden Invitation",
      text:
        "Maya arrived early at the library, holding an envelope that had been slipped into her locker before school. The front said, Keep this until lunch. She wanted to read it at once, but the reading room was filling with students, and Liam had already noticed the silver sticker on the corner. Maya folded the invitation carefully and placed it under her textbook before anyone could see it. When Liam asked whether it was homework, she smiled but did not answer. During silent reading, she kept glancing at the clock. At recess, she checked that the envelope was still flat and unbent. Sofia, who sat beside her, erased an answer in her workbook and checked the question again before writing neatly. Maya watched her and decided she should be just as careful. At last, the bell rang. Maya picked up the invitation, took a deep breath, and walked towards the courtyard where the school debating club usually met.",
      questionIds: ["q-reading-001", "q-reading-003", "q-reading-005", "q-reading-006", "q-reading-008"],
    },
    {
      title: "Passage B: The Windy Afternoon",
      text:
        "By lunchtime, the sky over the school oval had turned grey. The windows rattled whenever a gust moved across the courtyard, and students pulled their jackets tighter while waiting near the canteen. A notice beside the door explained that the Green Team had collected recycling from each classroom for four weeks. It included a table comparing how many bags of paper, plastic bottles, and food scraps each year level had saved from landfill. Maya packed an umbrella even though no rain had fallen yet. Tom rushed in late, cheeks red, and said the bus had been delayed near the shopping strip. Some students grew restless as the lunch line stopped moving, but the teacher on duty said, That was patient waiting; now let's make it sharper by leaving space for others. When the first drops began to fall, Maya opened her umbrella and shared it with Liam. The class returned inside, talking about which clue had warned them that the weather was about to change.",
      questionIds: ["q-reading-004", "q-reading-007", "q-reading-009", "q-reading-010", "q-reading-002"],
    },
  ],
  "quest-week2-day2": [
    {
      title: "Passage A: A Library That Works for Everyone",
      text:
        "The community library is more than a room of books. Each afternoon, families borrow novels, students use computers for homework, and a small group meets to practise chess near the windows. The librarian says the busiest hour is after school because students can find a quiet place before sport or music lessons. A poster beside the desk asks children to walk or cycle when possible because fewer cars make the streets safer and the air cleaner. The library also runs a reading club where members choose one short story each week and discuss the character's choices. Last month, three new clubs opened in one month: robotics, book art, and junior history. The changes made the library feel lively, but the main purpose stayed the same. It gave people a shared place to learn, ask questions, and enjoy ideas together.",
      questionIds: [
        "q-week2-reading-001",
        "q-week2-reading-003",
        "q-week2-reading-004",
        "q-week2-reading-010",
        "q-week2-reading-009",
      ],
    },
    {
      title: "Passage B: Small Choices, Big Effects",
      text:
        "In the school garden, students watched bees move between flowers. Their teacher explained that bees carry pollen, which helps many plants grow fruit and seeds. The class wrote a short article for assembly because some students only noticed bees when they were afraid of being stung. Lena checked the clock twice while waiting for her turn to read, but she continued practising the opening line under her breath. The article also described a village where a simple water filter helped families collect cleaner drinking water. At the end, the teacher asked the class to think about fairness. If a rule stops people from getting what they need, a brave person may question it respectfully. When rain finally softened the dry soil outside, everyone felt relieved. The lesson was clear: small actions, from protecting bees to solving water problems, can improve a whole community.",
      questionIds: [
        "q-week2-reading-002",
        "q-week2-reading-005",
        "q-week2-reading-006",
        "q-week2-reading-007",
        "q-week2-reading-008",
      ],
    },
  ],
};

const knowledgeScope = [
  {
    subject: "Maths",
    outcome: "A 52-topic sequence covering number fluency, proportion, algebra, geometry, measurement, data, probability, and exam problem solving.",
    branches: [
      {
        name: "Number Fluency",
        leaves: [
          "place value",
          "rounding and estimation",
          "mental addition",
          "mental subtraction",
          "multiplication facts",
          "division facts",
          "factors and multiples",
          "prime and composite numbers",
          "order of operations",
          "negative numbers",
          "money calculations",
          "non-calculator strategies",
          "arithmetic speed set",
        ],
      },
      {
        name: "Proportion",
        leaves: [
          "fraction equivalence",
          "comparing fractions",
          "adding fractions",
          "subtracting fractions",
          "fractions of quantities",
          "decimal place value",
          "decimal operations",
          "percent meaning",
          "percentage of amount",
          "percentage increase",
          "percentage discount",
          "ratio tables",
          "rate and speed basics",
        ],
      },
      {
        name: "Algebra & Space",
        leaves: [
          "number patterns",
          "function machines",
          "unknown values",
          "simple equations",
          "working backwards",
          "bar models",
          "coordinates",
          "angles",
          "triangles",
          "quadrilaterals",
          "area",
          "perimeter",
          "volume",
        ],
      },
      {
        name: "Data & Exams",
        leaves: [
          "unit conversion",
          "time and timetables",
          "scale and maps",
          "line graphs",
          "bar charts",
          "tables",
          "mean median mode",
          "range",
          "probability language",
          "probability fractions",
          "multi-step word problems",
          "error spotting",
          "mixed mock test",
        ],
      },
    ],
  },
  {
    subject: "Reading",
    outcome: "A 52-topic reading spine across literature, history, civics, economics, science texts, vocabulary, inference, evidence, and author craft.",
    branches: [
      {
        name: "Core Comprehension",
        leaves: [
          "literal meaning",
          "retrieving details",
          "main idea",
          "summarising",
          "inference",
          "text evidence",
          "vocabulary in context",
          "tone",
          "mood",
          "author purpose",
          "cause and effect",
          "compare and contrast",
          "best-supported answer",
        ],
      },
      {
        name: "Literature",
        leaves: [
          "character motive",
          "character change",
          "setting",
          "theme",
          "plot structure",
          "conflict",
          "point of view",
          "dialogue clues",
          "imagery",
          "symbolism",
          "poetry rhythm",
          "classic adventure extract",
          "historical fiction",
        ],
      },
      {
        name: "Knowledge Texts",
        leaves: [
          "ancient history",
          "migration history",
          "civics and rules",
          "leadership and fairness",
          "needs and wants",
          "markets and trade",
          "biography",
          "science article",
          "environment text",
          "technology article",
          "news report",
          "opinion article",
          "data in non-fiction",
        ],
      },
      {
        name: "Exam Reading",
        leaves: [
          "headings and structure",
          "text features",
          "bias and reliability",
          "argument evidence",
          "persuasive reading",
          "paired passages",
          "long passage stamina",
          "distractor elimination",
          "vocabulary traps",
          "inference traps",
          "timed passage set",
          "scholarship passage",
          "reading mock test",
        ],
      },
    ],
  },
  {
    subject: "English",
    outcome: "A 52-topic language program for grammar, punctuation, vocabulary, morphology, cloze logic, editing, and verbal reasoning.",
    branches: [
      {
        name: "Grammar",
        leaves: [
          "nouns",
          "verbs",
          "adjectives",
          "adverbs",
          "pronouns",
          "prepositions",
          "conjunctions",
          "subject-verb agreement",
          "tense consistency",
          "phrases",
          "clauses",
          "simple sentences",
          "complex sentences",
        ],
      },
      {
        name: "Punctuation & Syntax",
        leaves: [
          "capital letters",
          "full stops",
          "commas",
          "apostrophes",
          "quotation marks",
          "colons",
          "semicolons",
          "sentence fragments",
          "run-on sentences",
          "sentence combining",
          "parallel structure",
          "active voice",
          "passive voice",
        ],
      },
      {
        name: "Vocabulary",
        leaves: [
          "synonyms",
          "antonyms",
          "homophones",
          "word families",
          "prefixes",
          "suffixes",
          "Greek roots",
          "Latin roots",
          "word forms",
          "academic words",
          "shades of meaning",
          "figurative language",
          "context clues",
        ],
      },
      {
        name: "Cloze & Verbal",
        leaves: [
          "cause connectives",
          "contrast connectives",
          "condition connectives",
          "time connectives",
          "cloze by grammar",
          "cloze by meaning",
          "cloze by tone",
          "editing for clarity",
          "proofreading",
          "verbal analogies",
          "odd word out",
          "word relationships",
          "mixed language test",
        ],
      },
    ],
  },
  {
    subject: "Writing",
    outcome: "A 52-topic writing pathway for planning, genre control, sentence craft, evidence, vivid detail, editing, and timed responses.",
    branches: [
      {
        name: "Planning",
        leaves: [
          "understanding prompts",
          "brainstorming",
          "audience and purpose",
          "position statements",
          "story premise",
          "planning reasons",
          "planning evidence",
          "story mountain",
          "paragraph plan",
          "timed planning",
          "rubric awareness",
          "self-checklist",
          "idea selection",
        ],
      },
      {
        name: "Text Types",
        leaves: [
          "persuasive writing",
          "narrative writing",
          "informative writing",
          "descriptive writing",
          "explanation writing",
          "compare and contrast",
          "argument writing",
          "personal reflection",
          "speech writing",
          "letter writing",
          "review writing",
          "image prompt writing",
          "video prompt writing",
        ],
      },
      {
        name: "Craft",
        leaves: [
          "strong openings",
          "topic sentences",
          "supporting details",
          "specific evidence",
          "sensory imagery",
          "show not tell",
          "dialogue",
          "character voice",
          "setting detail",
          "cohesion",
          "sentence variety",
          "precise verbs",
          "effective endings",
        ],
      },
      {
        name: "Editing & Exams",
        leaves: [
          "spelling review",
          "grammar editing",
          "punctuation editing",
          "paragraph improvement",
          "clarity and concision",
          "formal tone",
          "creative tone",
          "100-word response",
          "150-word response",
          "200-word response",
          "timed persuasive task",
          "timed narrative task",
          "writing portfolio",
        ],
      },
    ],
  },
  {
    subject: "Science",
    outcome: "A 52-topic science framework covering biology, chemistry, earth and space, scientific inquiry, data, evidence, and conclusions.",
    branches: [
      {
        name: "Biology",
        leaves: [
          "living things",
          "classification",
          "plant structures",
          "animal structures",
          "adaptations",
          "habitats",
          "food chains",
          "food webs",
          "ecosystem change",
          "life cycles",
          "microorganisms",
          "human body systems",
          "health and survival",
        ],
      },
      {
        name: "Chemistry",
        leaves: [
          "material properties",
          "solids liquids gases",
          "particle model",
          "melting and freezing",
          "evaporation",
          "condensation",
          "mixtures",
          "separation",
          "dissolving",
          "solutions",
          "reversible change",
          "irreversible change",
          "chemical change basics",
        ],
      },
      {
        name: "Earth & Space",
        leaves: [
          "rocks",
          "soils",
          "fossils",
          "weathering",
          "water cycle",
          "weather",
          "climate",
          "natural resources",
          "earth sun moon",
          "day and night",
          "seasons",
          "solar system",
          "environmental systems",
        ],
      },
      {
        name: "Inquiry & Data",
        leaves: [
          "scientific questions",
          "independent variables",
          "dependent variables",
          "control variables",
          "fair testing",
          "repeated trials",
          "measurement",
          "tables",
          "line graphs",
          "bar graphs",
          "data reliability",
          "safe conclusions",
          "engineering design",
        ],
      },
    ],
  },
  {
    subject: "Physics",
    outcome: "A 52-topic applied physics sequence using diagrams and models for forces, motion, energy, waves, circuits, materials, and design.",
    branches: [
      {
        name: "Forces & Motion",
        leaves: [
          "push and pull",
          "balanced forces",
          "unbalanced forces",
          "gravity",
          "support force",
          "friction",
          "air resistance",
          "speed",
          "acceleration basics",
          "motion graphs",
          "simple machines",
          "levers",
          "ramps",
        ],
      },
      {
        name: "Energy & Heat",
        leaves: [
          "energy stores",
          "energy transfer",
          "kinetic energy",
          "potential energy",
          "heat transfer",
          "conduction",
          "convection",
          "radiation",
          "thermal insulation",
          "thermal conductivity",
          "efficiency",
          "energy loss",
          "everyday energy systems",
        ],
      },
      {
        name: "Light & Sound",
        leaves: [
          "light sources",
          "straight-line light",
          "shadows",
          "reflection",
          "mirrors",
          "refraction basics",
          "lenses",
          "colour",
          "sound vibration",
          "pitch",
          "volume",
          "echoes",
          "wave diagrams",
        ],
      },
      {
        name: "Electricity & Design",
        leaves: [
          "static electricity",
          "current electricity",
          "simple circuits",
          "series circuits",
          "switches",
          "bulbs and buzzers",
          "conductors",
          "insulators",
          "magnetism",
          "magnetic poles",
          "materials testing",
          "structures",
          "engineering challenge",
        ],
      },
    ],
  },
  {
    subject: "Reasoning",
    outcome: "A 52-topic reasoning sequence for verbal, numerical, spatial, logical, computational, data, probability, finance, and risk thinking.",
    branches: [
      {
        name: "Verbal",
        leaves: [
          "analogies",
          "synonym reasoning",
          "antonym reasoning",
          "odd word out",
          "word categories",
          "letter patterns",
          "code words",
          "compound words",
          "word relationships",
          "logic connectives",
          "verbal classification",
          "vocabulary deduction",
          "verbal mixed set",
        ],
      },
      {
        name: "Numerical",
        leaves: [
          "number sequences",
          "changing differences",
          "alternating rules",
          "square patterns",
          "cube patterns",
          "multiplicative rules",
          "missing numbers",
          "number analogies",
          "quantitative comparison",
          "working backwards",
          "logic arithmetic",
          "timed number set",
          "numerical mixed set",
        ],
      },
      {
        name: "Spatial & Logic",
        leaves: [
          "shape matrices",
          "rotation",
          "reflection",
          "symmetry",
          "folding",
          "nets",
          "3D views",
          "spatial sequences",
          "deduction grids",
          "truth statements",
          "conditions",
          "ordering puzzles",
          "logic mixed set",
        ],
      },
      {
        name: "Computing & Data",
        leaves: [
          "algorithms",
          "flowcharts",
          "if-then rules",
          "sorting",
          "classification trees",
          "tables",
          "charts",
          "probability",
          "expected value basics",
          "risk and reward",
          "finance vocabulary",
          "trading chart literacy",
          "reasoning mock test",
        ],
      },
    ],
  },
];

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeQuestId, setActiveQuestId] = useState(weeklyQuests[0].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [lastAward, setLastAward] = useState(0);
  const viewRef = useRef<View>(view);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [view, activeWeek, activeQuestId]);

  useEffect(() => {
    const appUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({ appView: "dashboard" }, "", appUrl);

    function handleBrowserBack() {
      if (viewRef.current === "dashboard") return;
      setView("dashboard");
      setAnswers({});
      setQuizSubmitted(false);
      setLastAward(0);
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
      window.history.replaceState({ appView: "dashboard" }, "", appUrl);
    }

    window.addEventListener("popstate", handleBrowserBack);
    return () => window.removeEventListener("popstate", handleBrowserBack);
  }, []);

  useEffect(() => {
    const appUrl = `${window.location.pathname}${window.location.search}`;
    const currentState = window.history.state as { appView?: View } | null;
    if (view === "dashboard") {
      if (currentState?.appView !== "dashboard") {
        window.history.replaceState({ appView: "dashboard" }, "", appUrl);
      }
      return;
    }
    if (currentState?.appView !== view) {
      window.history.pushState({ appView: view }, "", appUrl);
    }
  }, [view]);

  const weekOptions = useMemo(() => getLearningWeekOptions(progress.completedQuestIds), [progress.completedQuestIds]);

  useEffect(() => {
    if (weekOptions.includes(activeWeek)) return;
    const nextWeek = weekOptions[0] ?? 1;
    const nextQuests = getWeekQuests(nextWeek);
    setActiveWeek(nextWeek);
    setActiveQuestId(nextQuests[0]?.id ?? weeklyQuests[0].id);
    setAnswers({});
    setQuizSubmitted(false);
    setLastAward(0);
  }, [activeWeek, weekOptions]);

  const visibleQuests = getWeekQuests(activeWeek);
  const activeQuest = weeklyQuests.find((quest) => quest.id === activeQuestId) ?? visibleQuests[0] ?? weeklyQuests[0];
  const hasLifetimeAccess = progress.paymentStatus === "paid" || progress.paymentStatus === "test-active";
  const activeQuestRequiresAccess = questWeek(activeQuest.id) > FREE_PREVIEW_WEEKS && !hasLifetimeAccess;
  const questLessons = activeQuest.lessonIds
    .map((id) => lessonMap.get(id))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
  const questQuestions = buildDailyQuiz(activeQuest);
  const completedToday = progress.completedQuestIds.includes(activeQuest.id);

  const subjectAccuracy = useMemo(() => {
    return subjects.map((subject) => {
      const attempts = progress.attempts.filter((attempt) => questionMap.get(attempt.questionId)?.subject === subject.id);
      const correct = attempts.filter((attempt) => attempt.correct).length;
      return {
        ...subject,
        attempts: attempts.length,
        accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : null,
      };
    });
  }, [progress.attempts]);

  const mistakeQuestions = useMemo(() => {
    const wrongIds = new Set(progress.attempts.filter((attempt) => !attempt.correct).map((attempt) => attempt.questionId));
    return Array.from(wrongIds).map((id) => questionMap.get(id)).filter(Boolean) as Question[];
  }, [progress.attempts]);

  function updateProgress(next: ProgressState) {
    setProgress(next);
    saveProgress(next);
  }

  function submitQuiz() {
    const attemptTime = new Date().toISOString();
    const records = questQuestions.map((question) => {
      const selectedAnswer = answers[question.id] ?? "";
      const correct = isQuestionCorrect(question, selectedAnswer);
      return { questionId: question.id, selectedAnswer, correct, attemptedAt: attemptTime };
    });
    const correctCount = records.filter((record) => record.correct).length;
    const award = calculateCoins(correctCount, records.length, completedToday);
    const nextWeekStreak = completedToday
      ? progress.streak
      : visibleQuests.filter((quest) => progress.completedQuestIds.includes(quest.id)).length + 1;
    setLastAward(award);
    setQuizSubmitted(true);
    updateProgress({
      ...progress,
      coins: progress.coins + award,
      streak: nextWeekStreak,
      completedQuestIds: completedToday ? progress.completedQuestIds : [...progress.completedQuestIds, activeQuest.id],
      attempts: [...progress.attempts, ...records],
    });
  }

  function selectQuest(questId: string, nextView: View = "lesson") {
    setActiveQuestId(questId);
    setAnswers({});
    setQuizSubmitted(false);
    setLastAward(0);
    setView(nextView);
  }

  function resetQuiz() {
    setAnswers({});
    setQuizSubmitted(false);
    setLastAward(0);
    setView("quiz");
  }

  function deleteMistake(questionId: string) {
    updateProgress({
      ...progress,
      attempts: progress.attempts.filter((attempt) => attempt.questionId !== questionId),
    });
  }

  const correctCount = questQuestions.filter((question) => isQuestionCorrect(question, answers[question.id] ?? "")).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-icon">PH</span>
          <div>
            <strong>PreHighSchool</strong>
            <small>Academy</small>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
            Dashboard
          </button>
          <button className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}>
            Knowledge Map
          </button>
          <button className={view === "mistakes" ? "active" : ""} onClick={() => setView("mistakes")}>
            Mistake Bank
          </button>
          <button className={view === "rewards" ? "active" : ""} onClick={() => setView("rewards")}>
            Rewards
          </button>
          <button className={view === "account" ? "active" : ""} onClick={() => setView("account")}>
            Account
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        {view === "dashboard" && (
          <Dashboard
            activeQuest={activeQuest}
            activeWeek={activeWeek}
            completedToday={completedToday}
            progress={progress}
            subjectAccuracy={subjectAccuracy}
            visibleQuests={visibleQuests}
            weekOptions={weekOptions}
            onStartLesson={() => setView("lesson")}
            onStartQuiz={() => setView("quiz")}
            onWeekChange={(week) => {
              const nextQuests = getWeekQuests(week);
              setActiveWeek(week);
              setActiveQuestId(nextQuests[0]?.id ?? weeklyQuests[0].id);
              setAnswers({});
              setQuizSubmitted(false);
              setLastAward(0);
            }}
            onSelectQuest={selectQuest}
          />
        )}
        {view === "knowledge" && <KnowledgeMap progress={progress} />}
        {view === "subjects" && <SubjectsView onStartQuiz={() => setView("quiz")} />}
        {view === "lesson" &&
          (activeQuestRequiresAccess ? (
            <AccessGate
              progress={progress}
              quest={activeQuest}
              updateProgress={updateProgress}
              onAccount={() => setView("account")}
            />
          ) : (
            <LessonView
              activeQuest={activeQuest}
              answers={answers}
              correctCount={correctCount}
              lastAward={lastAward}
              lessons={questLessons}
              questions={questQuestions}
              submitted={quizSubmitted}
              onAnswer={(id, answer) => setAnswers((current) => ({ ...current, [id]: answer }))}
              onReset={resetQuiz}
              onSubmit={submitQuiz}
            />
          ))}
        {view === "quiz" &&
          (activeQuestRequiresAccess ? (
            <AccessGate
              progress={progress}
              quest={activeQuest}
              updateProgress={updateProgress}
              onAccount={() => setView("account")}
            />
          ) : (
            <QuizView
              activeQuest={activeQuest}
              answers={answers}
              correctCount={correctCount}
              lastAward={lastAward}
              questions={questQuestions}
              submitted={quizSubmitted}
              onAnswer={(id, answer) => setAnswers((current) => ({ ...current, [id]: answer }))}
              onReset={resetQuiz}
              onSubmit={submitQuiz}
            />
          ))}
        {view === "mistakes" && (
          <MistakeBank
            attempts={progress.attempts}
            questions={mistakeQuestions}
            onDelete={deleteMistake}
          />
        )}
        {view === "rewards" && <RewardsView progress={progress} updateProgress={updateProgress} />}
        {view === "parent" && <ParentView progress={progress} updateProgress={updateProgress} />}
        {view === "account" && <AccountView progress={progress} updateProgress={updateProgress} />}
      </main>
    </div>
  );
}

function AcademyLogo() {
  return (
    <svg className="academy-logo" viewBox="0 0 560 220" role="img" aria-label="PreHighSchool Academy logo">
      <defs>
        <linearGradient id="campus-building" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7f2ef" />
        </linearGradient>
      </defs>
      <g className="academy-logo-mark">
        <path d="M54 166h164" className="campus-base-line" />
        <path d="M78 148h116v18H78z" className="campus-step" />
        <path d="M88 92h96v56H88z" fill="url(#campus-building)" />
        <path d="M72 92h128L136 50z" className="campus-roof" />
        <path d="M84 92h104" className="campus-roof-line" />
        <path d="M104 108v40M128 108v40M152 108v40" className="campus-columns" />
        <path d="M132 124h18v24h-18z" className="campus-door" />
        <path d="M100 158h72" className="campus-book-spine" />
        <path d="M73 158c20-8 40-8 62 0M135 158c22-8 42-8 62 0" className="campus-book-pages" />
      </g>
      <g className="academy-logo-type">
        <text x="242" y="94">PreHighSchool</text>
        <text x="244" y="137">Academy</text>
        <path d="M245 158h190" />
        <text x="244" y="184">Selective &amp; Scholarship Readiness</text>
      </g>
    </svg>
  );
}

function Dashboard({
  activeQuest,
  activeWeek,
  completedToday,
  progress,
  subjectAccuracy,
  visibleQuests,
  weekOptions,
  onStartLesson,
  onStartQuiz,
  onWeekChange,
  onSelectQuest,
}: {
  activeQuest: DailyQuest;
  activeWeek: number;
  completedToday: boolean;
  progress: ProgressState;
  subjectAccuracy: Array<{ id: SubjectId; name: string; shortName: string; accent: string; attempts: number; accuracy: number | null }>;
  visibleQuests: DailyQuest[];
  weekOptions: number[];
  onStartLesson: () => void;
  onStartQuiz: () => void;
  onWeekChange: (week: number) => void;
  onSelectQuest: (questId: string, nextView?: View) => void;
}) {
  const weekCompleted = visibleQuests.filter((quest) => progress.completedQuestIds.includes(quest.id)).length;
  const weekProgress = visibleQuests.length ? Math.round((weekCompleted / visibleQuests.length) * 100) : 0;
  const streakLabel = `${weekCompleted} ${weekCompleted === 1 ? "day" : "days"}`;

  return (
    <section>
      <div className="hero-band">
        <div className="hero-identity">
          <div className="school-logo-frame">
            <AcademyLogo />
          </div>
          <div className="hero-copy">
            <p className="eyebrow">PreHighSchool Academy</p>
            <p className="hero-subtitle">Year 4-6 readiness for selective and scholarship pathways.</p>
          </div>
        </div>
      </div>

      <div className="week-switch" aria-label="Learning week selector">
        {weekOptions.map((week) => (
          <button className={activeWeek === week ? "active" : ""} key={week} onClick={() => onWeekChange(week)}>
            Week {week}
          </button>
        ))}
      </div>

      <section className="weekly-strip" aria-label="Weekly learning plan">
        {visibleQuests.map((quest) => {
          const subject = subjects.find((item) => item.id === quest.subject);
          const complete = progress.completedQuestIds.includes(quest.id);
          const active = quest.id === activeQuest.id;
          return (
            <button
              className={`day-token ${active ? "active" : ""} ${complete ? "complete" : ""}`}
              key={quest.id}
              onClick={() => onSelectQuest(quest.id, "lesson")}
              style={{ "--subject-color": subject?.accent } as CSSProperties}
            >
              <span>{quest.day.slice(0, 3)}</span>
              <strong>{subject?.shortName}</strong>
              {complete && <small>Completed</small>}
            </button>
          );
        })}
      </section>

      <div className="metric-grid dashboard-metrics">
        <Metric label="Streak" value={streakLabel} />
        <ProgressMetric label="This week" value={`${weekCompleted}/${visibleQuests.length}`} percent={weekProgress} />
        <Metric label="Points" value={progress.coins.toString()} />
      </div>

      <LearningBuddy />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressMetric({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="metric-card progress-card">
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <div className="large-progress" aria-label={`${label}: ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LearningBuddy() {
  return (
    <section className="buddy-panel" aria-label="Learning buddy">
      <div className="buddy-scene" aria-hidden="true">
        <div className="buddy-character buddy-main">
          <span className="buddy-head">
            <i />
            <i />
            <b />
          </span>
          <span className="buddy-body" />
          <span className="buddy-arm left" />
          <span className="buddy-arm right" />
          <span className="buddy-leg left" />
          <span className="buddy-leg right" />
        </div>
        <div className="buddy-character buddy-small">
          <span className="buddy-head">
            <i />
            <i />
            <b />
          </span>
          <span className="buddy-body" />
          <span className="buddy-arm left" />
          <span className="buddy-arm right" />
          <span className="buddy-leg left" />
          <span className="buddy-leg right" />
        </div>
        <div className="floating-blocks">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="buddy-copy">
        <h2>Pick today&apos;s mission.</h2>
        <p>One day, one subject, 10 quiz, 100 points.</p>
      </div>
    </section>
  );
}

function SubjectsView({ onStartQuiz }: { onStartQuiz: () => void }) {
  return (
    <section>
      <header className="section-header">
        <p className="eyebrow">Curriculum map</p>
        <h1>Seven commercial-grade subject modules</h1>
      </header>
      <div className="subject-grid">
        {subjects.map((subject) => (
          <article className="subject-card" key={subject.id} style={{ borderTopColor: subject.accent }}>
            <h2>{subject.name}</h2>
            <p>{subject.description}</p>
            <div className="topic-list">
              {subject.topics.slice(0, 6).map((topic) => (
                <span key={topic}>{topic}</span>
              ))}
            </div>
            <button className="inline-action" onClick={onStartQuiz}>
              Practice sample
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function KnowledgeMap({ progress }: { progress: ProgressState }) {
  const yearlyTopics = knowledgeScope.length * YEAR_WEEKS;
  const writingTopics = knowledgeScope.filter((item) => item.subject === "Writing").length * YEAR_WEEKS;
  const yearlyQuizTasks = (yearlyTopics - writingTopics) * DAILY_QUIZ_TARGET + writingTopics;
  const yearlyQuizCredits = yearlyTopics * DAILY_QUIZ_TARGET;
  const completedTopics = completedKnowledgeTopics(progress.completedQuestIds);
  const [activeSubject, setActiveSubject] = useState(knowledgeScope[0].subject);
  const selectedSubject = knowledgeScope.find((item) => item.subject === activeSubject) ?? knowledgeScope[0];

  return (
    <section>
      <header className="section-header knowledge-header">
        <h1>Year 4-6 knowledge tree</h1>
        <p>
          A full-year learning spine for highschool and potential scholarship readiness.
        </p>
      </header>

      <div className="knowledge-overview">
        <div>
          <small>Annual Structure</small>
          <strong>{yearlyTopics} Daily Topics</strong>
          <span>
            {yearlyQuizTasks.toLocaleString()} Quiz Tasks | {yearlyQuizCredits.toLocaleString()} Quiz Credits
          </span>
        </div>
        <div>
          <small>Weekly Rhythm</small>
          <strong>7 Subjects</strong>
          <span>One Focused Lesson, 100 Points Per Day</span>
        </div>
        <div>
          <small>Content Model</small>
          <strong>Learn &gt; Demo &gt; Quiz</strong>
          <span>Visual Models, Video Support, And Mistake-Bank Review</span>
        </div>
      </div>

      <div className="subject-tabs" role="tablist" aria-label="Knowledge subjects">
        {knowledgeScope.map((item) => (
          <button
            aria-selected={item.subject === selectedSubject.subject}
            className={item.subject === selectedSubject.subject ? "active" : ""}
            key={item.subject}
            onClick={() => setActiveSubject(item.subject)}
            role="tab"
          >
            {item.subject}
          </button>
        ))}
      </div>

      <article className="knowledge-tree-card tabbed" role="tabpanel">
        <header>
          <small>{YEAR_WEEKS} topics</small>
          <h2>{selectedSubject.subject}</h2>
          <p>{selectedSubject.outcome}</p>
        </header>
        <div className="tree-branches">
          {selectedSubject.branches.map((branch) => (
            <section className="tree-branch" key={branch.name}>
              <h3>{branch.name}</h3>
              <ul>
                {branch.leaves.map((leaf) => {
                  const complete = completedTopics.has(knowledgeTopicKey(selectedSubject.subject, leaf));
                  return (
                    <li className={complete ? "complete" : ""} key={leaf}>
                      {leaf}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

function LessonView({
  activeQuest,
  answers,
  correctCount,
  lastAward,
  lessons,
  questions,
  submitted,
  onAnswer,
  onReset,
  onSubmit,
}: {
  activeQuest: DailyQuest;
  answers: Record<string, string>;
  correctCount: number;
  lastAward: number;
  lessons: Lesson[];
  questions: Question[];
  submitted: boolean;
  onAnswer: (id: string, answer: string) => void;
  onReset: () => void;
  onSubmit: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"learn" | "demo" | "quiz">("learn");
  const allAnswered = questions.every((question) => (answers[question.id] ?? "").trim().length > 0);

  return (
    <section>
      <header className="section-header">
        <h1>{activeQuest.title}</h1>
        <p>{activeQuest.description}</p>
      </header>
      <div className="lesson-stack">
        {lessons.map((lesson) => (
          <article className="lesson-panel" key={lesson.id}>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <div className="lesson-tabs" role="tablist" aria-label="Lesson sections">
              {[
                ["learn", "Learn"],
                ["demo", "Demo"],
                ["quiz", "Quiz"],
              ].map(([id, label]) => (
                <button
                  aria-selected={activeTab === id}
                  className={activeTab === id ? "active" : ""}
                  key={id}
                  onClick={() => setActiveTab(id as "learn" | "demo" | "quiz")}
                  role="tab"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="lesson-tab-panel" role="tabpanel">
              {activeTab === "learn" && (
                <section className="learning-stage learn-stage">
                  <SwipePager className="learn-pages" label="Swipe learning pages">
                    <article className="swipe-page">
                      <LearningFramework lesson={lesson} />
                    </article>
                    <article className="swipe-page">
                      <section className="focus-section theory-section">
                        <div>
                          <strong>Case study</strong>
                          <ul className="case-study-list">
                            {getCaseStudyNarrative(lesson).map((item) => (
                              <li key={item.label}>
                                <b>{item.label}:</b> {item.text}
                              </li>
                            ))}
                          </ul>
                          <div className="worked-formula-grid">
                            {(lesson.workedFormulas ?? []).map((formula) => (
                              <article className="worked-formula" key={`${formula.label}-${formula.expression}`}>
                                <small>{formula.label}</small>
                                <code>{formula.expression}</code>
                                <b>{formula.result}</b>
                              </article>
                            ))}
                          </div>
                          <p className="academic-language-intro">Academic language in this case:</p>
                          <div className="theory-chips compact">
                            {lesson.academicLanguage.slice(0, 4).map((item) => (
                              <code key={item}>{item}</code>
                            ))}
                          </div>
                        </div>
                      </section>
                    </article>
                    <article className="swipe-page">
                      <div className="quick-check-box">
                        <strong>Quick check</strong>
                        <p>{lesson.quickCheck}</p>
                        <small>{lesson.extensionPrompt}</small>
                      </div>
                      <div className="strategy-box">
                        <strong>Exam strategy</strong>
                        <p>{lesson.examStrategy}</p>
                        <div className="trap-line">
                          <b>Common traps:</b> {lesson.commonTraps.join(" ")}
                        </div>
                      </div>
                    </article>
                  </SwipePager>
              </section>
              )}

              {activeTab === "demo" && (
                <section className="learning-stage demo-stage">
                  <SwipePager className="demo-pages" label="Swipe demo pages">
                    <article className="swipe-page">
                      <div className="media-panel demo-first-page">
                        <div>
                          <strong>{lesson.visualModel.title}</strong>
                          <VisualModel kind={lesson.visualModel.kind} />
                          <p>{lesson.visualModel.caption}</p>
                        </div>
                        <VideoSupport videos={lesson.videoLinks} />
                      </div>
                    </article>
                    <article className="swipe-page">
                      <div className="example-box">
                        <div>
                          <strong>Demo 1</strong>
                          <p>{lesson.workedExample}</p>
                        </div>
                        <div>
                          <strong>Demo 2</strong>
                          <p>{lesson.secondDemo}</p>
                        </div>
                      </div>
                    </article>
                    <article className="swipe-page">
                      <div className="demo-practice-card">
                        <strong>Try the model</strong>
                        <p>{lesson.quickCheck}</p>
                        <small>{lesson.extensionPrompt}</small>
                      </div>
                    </article>
                  </SwipePager>
              </section>
              )}

              {activeTab === "quiz" && (
                <section className="learning-stage quiz-stage">
                <InlineQuizPanel
                  activeQuest={activeQuest}
                  answers={answers}
                  correctCount={correctCount}
                  lastAward={lastAward}
                  questions={questions}
                  submitted={submitted}
                  allAnswered={allAnswered}
                  onAnswer={onAnswer}
                  onReset={onReset}
                  onSubmit={onSubmit}
                />
              </section>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VideoSupport({ videos }: { videos: Lesson["videoLinks"] }) {
  const rankedVideos = [...videos].sort((a, b) => b.qualityScore - a.qualityScore);
  const embeddableVideos = rankedVideos.filter((video) => video.videoId);
  const [activeVideoId, setActiveVideoId] = useState(embeddableVideos[0]?.videoId ?? "");
  const activeVideo = embeddableVideos.find((video) => video.videoId === activeVideoId) ?? embeddableVideos[0];

  return (
    <div>
      <div className="video-heading">
        <strong>Recommended video</strong>
        <span>Ranked by topic fit</span>
      </div>
      {activeVideo ? (
        <>
          <div className="video-embed">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1`}
              title={activeVideo.title}
            />
          </div>
          <p className="video-fit">{activeVideo.fit}</p>
        </>
      ) : (
        <div className="video-fallback">
          <strong>Smart search ready</strong>
          <p>No verified embeddable video has been approved for this topic yet. Use the ranked search below.</p>
        </div>
      )}
      <div className="video-list compact">
        {rankedVideos.map((video) =>
          video.videoId ? (
            <button
              className={video.videoId === activeVideo?.videoId ? "active" : ""}
              key={`${video.title}-${video.videoId}`}
              onClick={() => setActiveVideoId(video.videoId ?? "")}
            >
              <span>{video.title}</span>
              <small>{video.source} | {video.qualityScore}% fit</small>
            </button>
          ) : (
            <a href={video.url} key={video.url} rel="noreferrer" target="_blank">
              <span>{video.title}</span>
              <small>Search YouTube | {video.qualityScore}% fit</small>
            </a>
          )
        )}
      </div>
    </div>
  );
}

function SwipePager({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pageCount = Children.count(children);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const pageWidth = Math.max(1, container.scrollWidth / Math.max(1, pageCount));
    const nextIndex = Math.min(pageCount - 1, Math.max(0, Math.round(container.scrollLeft / pageWidth)));
    setActiveIndex(nextIndex);
  }

  return (
    <>
      <PageHint activeIndex={activeIndex} count={pageCount} />
      <div
        aria-label={label}
        className={`swipe-pages ${className}`}
        onScroll={handleScroll}
        ref={containerRef}
      >
        {children}
      </div>
    </>
  );
}

function PageHint({ count, activeIndex = 0 }: { count: number; activeIndex?: number }) {
  return (
    <div className="page-hint" aria-label={`${count} swipe pages`}>
      <span>Swipe pages</span>
      <div>
        {Array.from({ length: count }).map((_, index) => (
          <i className={activeIndex === index ? "active" : ""} key={index} />
        ))}
      </div>
      <small>{activeIndex + 1}/{count}</small>
    </div>
  );
}

function LearningFramework({ lesson }: { lesson: Lesson }) {
  const frame = getLearningFrame(lesson);
  return (
    <section className="learning-framework" aria-label="What why how learning framework">
      <article className="learning-frame-card what-card">
        <span>What</span>
        <h3>Today's topic</h3>
        <p>{frame.what}</p>
        <ul>
          {lesson.learningGoals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </article>
      <article className="learning-frame-card why-card">
        <span>Why</span>
        <h3>Why it matters</h3>
        <p>{frame.why}</p>
        <ul>
          {lesson.coreConcepts.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </article>
      <article className="learning-frame-card how-card">
        <span>How</span>
        <h3>Use the method</h3>
        <p>{frame.how}</p>
        <ul>
          {lesson.keyIdeas.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function InlineQuizPanel({
  activeQuest,
  answers,
  allAnswered,
  correctCount,
  lastAward,
  questions,
  submitted,
  onAnswer,
  onReset,
  onSubmit,
}: {
  activeQuest: DailyQuest;
  answers: Record<string, string>;
  allAnswered: boolean;
  correctCount: number;
  lastAward: number;
  questions: Question[];
  submitted: boolean;
  onAnswer: (id: string, answer: string) => void;
  onReset: () => void;
  onSubmit: () => void;
}) {
  const isWritingQuiz = questions.length === 1 && questions[0]?.type === "writing";
  const passageSets = activeQuest.subject === "reading" ? readingQuizPassages[activeQuest.id] : undefined;
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const quizCreditTotal = isWritingQuiz ? DAILY_QUIZ_TARGET : questions.length;
  const displayedCorrect = isWritingQuiz && submitted && correctCount > 0 ? DAILY_QUIZ_TARGET : correctCount;
  const accuracy = getAccuracyPercent(correctCount, questions.length);
  const quizPageCount = passageSets ? passageSets.length : questions.length;
  return (
    <div className="inline-quiz">
      <div className="inline-quiz-header">
        <span>
          {submitted
            ? `Accuracy ${accuracy}% - ${displayedCorrect}/${quizCreditTotal} quiz credits`
            : isWritingQuiz
              ? "One writing task - worth 10 quiz credits"
              : "Answer all questions"}
        </span>
      </div>
      <PageHint count={Math.max(1, quizPageCount)} />
      {passageSets ? (
        <div className="reading-passage-stack swipe-pages quiz-pages" aria-label="Swipe reading quiz passages">
          {passageSets.map((passage, passageIndex) => (
            <section className="reading-passage-block swipe-page" key={passage.title}>
              <div className="reading-passage-copy">
                <span>Passage {String.fromCharCode(65 + passageIndex)}</span>
                <h3>{passage.title.replace(/^Passage [A-Z]:\s*/, "")}</h3>
                <p>{passage.text}</p>
              </div>
              <div className="reading-passage-questions">
                {passage.questionIds.map((questionId, questionIndex) => {
                  const question = questionsById.get(questionId);
                  if (!question) return null;
                  return (
                    <InlineQuestionCard
                      answers={answers}
                      index={passageIndex * 5 + questionIndex}
                      key={question.id}
                      question={question}
                      submitted={submitted}
                      onAnswer={onAnswer}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="inline-question-list swipe-pages quiz-pages" aria-label="Swipe quiz questions">
          {questions.map((question, index) => (
            <div className="swipe-page" key={question.id}>
              <InlineQuestionCard
                answers={answers}
                index={index}
                question={question}
                submitted={submitted}
                onAnswer={onAnswer}
              />
            </div>
          ))}
        </div>
      )}
      <div className="inline-quiz-actions">
        {!submitted ? (
          <button className="primary-action" disabled={!allAnswered} onClick={onSubmit}>
            Submit quiz
          </button>
        ) : (
          <>
            <strong>
              Accuracy {accuracy}% - {displayedCorrect}/{quizCreditTotal} quiz credits - +{lastAward} points
            </strong>
            <button className="secondary-action" onClick={onReset}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InlineQuestionCard({
  answers,
  index,
  question,
  submitted,
  onAnswer,
}: {
  answers: Record<string, string>;
  index: number;
  question: Question;
  submitted: boolean;
  onAnswer: (id: string, answer: string) => void;
}) {
  const selected = answers[question.id] ?? "";
  const isCorrect = isQuestionCorrect(question, selected);
  return (
    <article className={`inline-question ${submitted ? (isCorrect ? "correct" : "incorrect") : ""}`} key={question.id}>
      <div className="question-meta">
        <span>Q{index + 1}</span>
        <span>Level {question.difficulty}</span>
      </div>
      <h3>{question.prompt}</h3>
      {question.type === "writing" ? (
        <>
          <textarea
            aria-label={`Answer for ${question.id}`}
            disabled={submitted}
            onChange={(event) => onAnswer(question.id, event.target.value)}
            placeholder="Write 100-200 words here."
            value={selected}
          />
          <div className="writing-helper">
            <span>{wordCount(selected)} words</span>
            <span>{writingWordStatus(selected)}</span>
            <span>Worth 10 quiz credits</span>
          </div>
        </>
      ) : (
        <div className="choice-grid compact">
          {question.choices?.map((choice) => (
            <button
              className={selected === choice ? "selected" : ""}
              disabled={submitted}
              key={choice}
              onClick={() => onAnswer(question.id, choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
      {submitted && (
        <div className="feedback-box compact">
          <strong>{isCorrect ? "Correct" : "Review"}</strong>
          <div className="answer-review">
            <span>Your answer: {formatAnswer(selected) || "No answer"}</span>
            <span>Correct answer: {formatAnswer(question.correctAnswer)}</span>
          </div>
          <p>{question.explanation}</p>
        </div>
      )}
    </article>
  );
}

function VisualModel({ kind }: { kind: Lesson["visualModel"]["kind"] }) {
  if (kind === "percent-bar") {
    return (
      <div className="visual-model graphic-demo percent-demo" aria-hidden="true">
        <div className="percent-bar-demo">
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
        <div className="pie-demo">
          <div className="pie-chart" />
          <span>75% = 3/4</span>
        </div>
        <div className="discount-flow">
          <span>$80</span>
          <b>-25%</b>
          <span>$60</span>
        </div>
      </div>
    );
  }

  if (kind === "force-arrows") {
    return (
      <div className="visual-model force-visual" aria-hidden="true">
        <span className="arrow-left">Force</span>
        <span className="object-dot" />
        <span className="arrow-right">Force</span>
      </div>
    );
  }

  if (kind === "energy-chain") {
    return (
      <div className="visual-model energy-chain-visual" aria-hidden="true">
        <span>Battery</span>
        <b>electrical</b>
        <span>Bulb</span>
        <b>light + heat</b>
        <span>Output</span>
      </div>
    );
  }

  if (kind === "graph-evidence") {
    return (
      <div className="visual-model graph-evidence-visual" aria-hidden="true">
        <div className="graph-axis">
          <span style={{ height: "35%" }} />
          <span style={{ height: "48%" }} />
          <span style={{ height: "68%" }} />
          <span style={{ height: "82%" }} />
        </div>
        <div className="graph-labels">
          <b>trend ↑</b>
          <small>read title, axes, units, evidence</small>
        </div>
      </div>
    );
  }

  if (kind === "food-web") {
    return (
      <div className="visual-model food-web-visual" aria-hidden="true">
        <span>Sun</span>
        <b>→</b>
        <span>Grass</span>
        <b>→</b>
        <span>Rabbit</span>
        <b>→</b>
        <span>Fox</span>
      </div>
    );
  }

  if (kind === "matrix-grid") {
    return (
      <div className="visual-model matrix-grid-visual" aria-hidden="true">
        {["●", "■", "▲", "■", "▲", "●", "▲", "●", "?"].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
    );
  }

  if (kind === "ratio-table") {
    return (
      <div className="visual-model ratio-table-visual" aria-hidden="true">
        <span>1/2</span>
        <b>=</b>
        <span>0.5</span>
        <b>=</b>
        <span>50%</span>
      </div>
    );
  }

  if (kind === "writing-plan") {
    return (
      <div className="visual-model plan-visual" aria-hidden="true">
        <span>Position</span>
        <span>Reason</span>
        <span>Evidence</span>
      </div>
    );
  }

  if (kind === "cloze-flow") {
    return (
      <div className="visual-model flow-visual" aria-hidden="true">
        <span>Predict</span>
        <span>Meaning</span>
        <span>Grammar</span>
      </div>
    );
  }

  if (kind === "sequence-steps") {
    return (
      <div className="visual-model sequence-visual" aria-hidden="true">
        <span>3</span>
        <span>+3</span>
        <span>6</span>
        <span>+5</span>
        <span>11</span>
        <span>+7</span>
        <span>18</span>
      </div>
    );
  }

  return (
    <div className="visual-model evidence-visual" aria-hidden="true">
      <span>Clue</span>
      <span>+</span>
      <span>Clue</span>
      <span>=</span>
      <span>Inference</span>
    </div>
  );
}

function QuizView({
  activeQuest,
  answers,
  correctCount,
  lastAward,
  questions,
  submitted,
  onAnswer,
  onReset,
  onSubmit,
}: {
  activeQuest: DailyQuest;
  answers: Record<string, string>;
  correctCount: number;
  lastAward: number;
  questions: Question[];
  submitted: boolean;
  onAnswer: (id: string, answer: string) => void;
  onReset: () => void;
  onSubmit: () => void;
}) {
  const allAnswered = questions.every((question) => (answers[question.id] ?? "").trim().length > 0);
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS);
  const accuracy = getAccuracyPercent(correctCount, questions.length);

  useEffect(() => {
    setSecondsLeft(QUIZ_SECONDS);
  }, [activeQuest.id]);

  useEffect(() => {
    if (submitted || secondsLeft <= 0) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [secondsLeft, submitted]);

  return (
    <section>
      <header className="section-header quiz-header">
        <div>
          <p className="eyebrow">Daily Quiz</p>
          <h1>{activeQuest.title}</h1>
        </div>
        <div className="timer-box" aria-label="Quiz countdown">
          {formatCountdown(secondsLeft)}
        </div>
      </header>

      <div className="quiz-stack">
        {questions.map((question, index) => {
          const selected = answers[question.id] ?? "";
          const isCorrect = isQuestionCorrect(question, selected);
          return (
            <article className={`question-panel ${submitted ? (isCorrect ? "correct" : "incorrect") : ""}`} key={question.id}>
              <div className="question-meta">
                <span>Q{index + 1}</span>
                <span>Level {question.difficulty}</span>
              </div>
              <h2>{question.prompt}</h2>
              {question.type === "writing" ? (
                <>
                  <textarea
                    aria-label={`Answer for ${question.id}`}
                    disabled={submitted}
                    onChange={(event) => onAnswer(question.id, event.target.value)}
                    placeholder="Write 100-200 words here."
                    value={selected}
                  />
                  <div className="writing-helper">
                    <span>{wordCount(selected)} words</span>
                    <span>Target: 100-200</span>
                    <span>Parent-approved sharing only</span>
                  </div>
                </>
              ) : (
                <div className="choice-grid">
                  {question.choices?.map((choice) => (
                    <button
                      className={selected === choice ? "selected" : ""}
                      disabled={submitted}
                      key={choice}
                      onClick={() => onAnswer(question.id, choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
              {submitted && (
                <div className="feedback-box">
                  <strong>{isCorrect ? "Correct" : "Review"}</strong>
                  <div className="answer-review">
                    <span>Your answer: {formatAnswer(selected) || "No answer"}</span>
                    <span>Correct answer: {formatAnswer(question.correctAnswer)}</span>
                  </div>
                  <p>{question.explanation}</p>
                  {question.type === "writing" && (
                    <small>
                      Basic check: 100-200 words, clear position, reasons, evidence, and no private personal details.
                    </small>
                  )}
                  <small>Skill: {question.skillType}</small>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="sticky-actions">
        {submitted ? (
          <>
            <strong>
              Accuracy: {accuracy}% | Score: {correctCount}/{questions.length} | Points earned: {lastAward}
            </strong>
            <button className="secondary-action" onClick={onReset}>
              Retry quest
            </button>
          </>
        ) : (
          <>
            <strong>
              Answered {Object.keys(answers).length}/{questions.length}
            </strong>
            <button className="primary-action" disabled={!allAnswered} onClick={onSubmit}>
              Submit quiz
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function MistakeBank({
  attempts,
  questions,
  onDelete,
}: {
  attempts: AttemptRecord[];
  questions: Question[];
  onDelete: (questionId: string) => void;
}) {
  const [activeSubject, setActiveSubject] = useState<SubjectId | "all">("all");
  const latestWrongAttempt = new Map<string, AttemptRecord>();
  attempts
    .filter((attempt) => !attempt.correct)
    .forEach((attempt) => latestWrongAttempt.set(attempt.questionId, attempt));
  const filteredQuestions = activeSubject === "all"
    ? questions
    : questions.filter((question) => question.subject === activeSubject);
  const subjectCounts = new Map<SubjectId, number>();
  questions.forEach((question) => {
    subjectCounts.set(question.subject, (subjectCounts.get(question.subject) ?? 0) + 1);
  });

  return (
    <section>
      <header className="section-header">
        <p className="eyebrow">Adaptive review</p>
        <h1>Mistake Bank</h1>
      </header>
      {questions.length === 0 ? (
        <div className="empty-state">
          <h2>No mistakes recorded yet.</h2>
          <p>Complete a quiz to unlock targeted review.</p>
        </div>
      ) : (
        <>
          <div className="subject-tabs mistake-subject-tabs" role="tablist" aria-label="Mistake subjects">
            <button
              aria-selected={activeSubject === "all"}
              className={activeSubject === "all" ? "active" : ""}
              onClick={() => setActiveSubject("all")}
              role="tab"
            >
              All ({questions.length})
            </button>
            {subjects.map((subject) => {
              const count = subjectCounts.get(subject.id) ?? 0;
              return (
                <button
                  aria-selected={activeSubject === subject.id}
                  className={activeSubject === subject.id ? "active" : ""}
                  disabled={count === 0}
                  key={subject.id}
                  onClick={() => setActiveSubject(subject.id)}
                  role="tab"
                >
                  {subject.shortName} ({count})
                </button>
              );
            })}
          </div>
          {filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <h2>No mistakes for this subject.</h2>
              <p>Choose another subject or complete more quizzes.</p>
            </div>
          ) : (
            <div className="review-list">
              {filteredQuestions.map((question, index) => (
                <article className="review-item" key={question.id}>
                  <div className="review-item-header">
                    <div>
                      <span className="review-index">Q{index + 1}</span>
                      <strong>{question.topic}</strong>
                    </div>
                    <button className="delete-action" onClick={() => onDelete(question.id)} type="button">
                      Delete
                    </button>
                  </div>
                  <p>{question.prompt}</p>
                  <div className="answer-review">
                    <span>Your answer: {formatAnswer(latestWrongAttempt.get(question.id)?.selectedAnswer) || "No answer"}</span>
                    <span>Correct answer: {formatAnswer(question.correctAnswer)}</span>
                  </div>
                  <p className="review-explanation">{question.explanation}</p>
                  <small>{question.mistakeTags.join(", ")}</small>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RewardsView({
  progress,
  updateProgress,
}: {
  progress: ProgressState;
  updateProgress: (progress: ProgressState) => void;
}) {
  const rewardTarget = progress.rewardRules[0]?.coins ?? 700;
  const selectedReward = rewardOptions.find((option) => option.id === progress.selectedReward) ?? rewardOptions[0];
  const weeklyBadgeTarget = 7;
  const weeklyCompleted = Math.min(progress.completedQuestIds.length, weeklyBadgeTarget);
  const weeklyBadgeUnlocked = weeklyCompleted === weeklyBadgeTarget;
  const redeemedRewards = Math.floor(progress.coins / rewardTarget);
  const cyclePoints = progress.coins > 0 && progress.coins % rewardTarget === 0 ? rewardTarget : progress.coins % rewardTarget;
  const percent = Math.min(100, Math.round((cyclePoints / rewardTarget) * 100));
  const remaining = Math.max(0, rewardTarget - cyclePoints);
  const completed = cyclePoints === rewardTarget;
  return (
    <section className="roblox-rewards">
      <div className={`roblox-card ${completed ? "celebrate" : ""}`}>
        {completed && (
          <div className="confetti-layer" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}
        <div className="roblox-cube" aria-hidden="true">
          <span />
        </div>
        <div className="roblox-copy">
          <p className="eyebrow">Cumulative Reward</p>
          <h1>{selectedReward.title}</h1>
          <p>Every 700 points unlocks a parent-approved reward.</p>
          <div className="roblox-progress">
            <div>
              <strong>{cyclePoints}</strong>
              <small>/ {rewardTarget} points</small>
            </div>
            <div className="large-progress">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="reward-status">
            {completed ? "Ready to redeem" : `${remaining} points to go`}
          </div>
          <p className="total-points">Total saved: {progress.coins} points | Rewards earned: {redeemedRewards}</p>
        </div>
        <div className="blocky-pattern" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <section className="reward-choice-panel" aria-label="Weekly reward choices">
        <div>
          <p className="eyebrow">Reward Choice</p>
          <h2>Choose the weekly reward</h2>
        </div>
        <div className="reward-choice-grid">
          {rewardOptions.map((option) => (
            <button
              className={option.id === progress.selectedReward ? "active" : ""}
              key={option.id}
              onClick={() => updateProgress({ ...progress, selectedReward: option.id })}
              type="button"
            >
              <strong>{option.shortTitle}</strong>
              <span>{option.detail}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="badge-panel">
        <div className="badge-token" aria-hidden="true">
          <span>★</span>
        </div>
        <div>
          <p className="eyebrow">Weekly Badge</p>
          <h2>Roblox Quest Badge</h2>
          <p>{weeklyBadgeUnlocked ? "Week complete. Badge unlocked." : "Finish 7 missions to unlock."}</p>
        </div>
        <strong>{weeklyBadgeUnlocked ? "Unlocked" : `${weeklyCompleted}/7`}</strong>
      </div>
    </section>
  );
}

function AccessGate({
  progress,
  quest,
  updateProgress,
  onAccount,
}: {
  progress: ProgressState;
  quest: DailyQuest;
  updateProgress: (progress: ProgressState) => void;
  onAccount: () => void;
}) {
  const [email, setEmail] = useState(progress.userEmail);
  const week = questWeek(quest.id);

  function saveEmail() {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return;
    updateProgress({ ...progress, userEmail: normalized });
  }

  function activateTestAccess() {
    updateProgress({
      ...progress,
      userEmail: email.trim().toLowerCase() || progress.userEmail,
      paymentStatus: "test-active",
    });
  }

  return (
    <section className="access-gate">
      <div className="access-gate-card">
        <p className="eyebrow">Lifetime Access</p>
        <h1>Unlock Week {week} and the full 52-week program</h1>
        <p>
          Weeks 1-2 are free to preview. Full access is a one-time AU${LIFETIME_ACCESS_AUD} lifetime purchase for this
          parent account.
        </p>
        <div className="access-gate-form">
          <label>
            Parent email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="parent@example.com"
              type="email"
              value={email}
            />
          </label>
          <div className="action-row">
            <button className="secondary-action" onClick={saveEmail} type="button">
              Save email
            </button>
            <button className="primary-action" onClick={activateTestAccess} type="button">
              Activate test access
            </button>
            <button className="secondary-action" onClick={onAccount} type="button">
              Account settings
            </button>
          </div>
        </div>
        <p className="account-note">
          Commercial release note: real payments must be verified by Stripe Checkout and a backend webhook before access
          is marked as paid.
        </p>
      </div>
    </section>
  );
}

function AccountView({
  progress,
  updateProgress,
}: {
  progress: ProgressState;
  updateProgress: (progress: ProgressState) => void;
}) {
  const [email, setEmail] = useState(progress.userEmail);
  const hasAccount = Boolean(progress.userEmail);
  const hasAccess = progress.paymentStatus === "paid" || progress.paymentStatus === "test-active";
  const selectedReward = rewardOptions.find((option) => option.id === progress.selectedReward) ?? rewardOptions[0];

  function saveEmail() {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return;
    updateProgress({ ...progress, userEmail: normalized });
  }

  function activateTestAccess() {
    updateProgress({ ...progress, paymentStatus: "test-active" });
  }

  return (
    <section>
      <header className="section-header">
        <p className="eyebrow">Account</p>
        <h1>PreHighSchool Academy access</h1>
        <p>Use one parent email for progress, lifetime access, and weekly reward settings.</p>
      </header>

      <div className="commercial-grid">
        <section className="account-card">
          <p className="eyebrow">Email Login</p>
          <h2>{hasAccount ? "Signed in" : "Create account"}</h2>
          <label>
            Parent email
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="parent@example.com"
              type="email"
              value={email}
            />
          </label>
          <button className="primary-action" onClick={saveEmail} type="button">
            Save email
          </button>
          {hasAccount && <p className="account-note">Current account: {progress.userEmail}</p>}
        </section>

        <section className="account-card lifetime-card">
          <p className="eyebrow">Lifetime Access</p>
          <h2>AU${LIFETIME_ACCESS_AUD}</h2>
          <p>One payment unlocks the full 52-week program on this account.</p>
          <div className={`access-state ${hasAccess ? "active" : ""}`}>
            {hasAccess ? "Access active" : "Payment required"}
          </div>
          <button className="primary-action" disabled={!hasAccount} onClick={activateTestAccess} type="button">
            Activate test access
          </button>
          <p className="account-note">
            Production payment should use Stripe Checkout and a server webhook before setting paid access.
          </p>
        </section>

        <section className="account-card reward-account-card">
          <p className="eyebrow">Weekly Reward</p>
          <h2>{selectedReward.title}</h2>
          <div className="reward-choice-grid compact">
            {rewardOptions.map((option) => (
              <button
                className={option.id === progress.selectedReward ? "active" : ""}
                key={option.id}
                onClick={() => updateProgress({ ...progress, selectedReward: option.id })}
                type="button"
              >
                <strong>{option.shortTitle}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ParentView({
  progress,
  updateProgress,
}: {
  progress: ProgressState;
  updateProgress: (progress: ProgressState) => void;
}) {
  const [coins, setCoins] = useState("700");
  const totalAttempts = progress.attempts.length;
  const correctAttempts = progress.attempts.filter((attempt) => attempt.correct).length;
  const accuracy = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  function addRule() {
    const parsedCoins = Number(coins);
    if (!parsedCoins) return;
    updateProgress({
      ...progress,
      rewardRules: [...progress.rewardRules, { coins: parsedCoins, reward: "Weekly parent-approved reward" }].sort(
        (a, b) => a.coins - b.coins,
      ),
    });
  }

  return (
    <section>
      <header className="section-header">
        <p className="eyebrow">Parent dashboard</p>
        <h1>Progress and reward settings</h1>
      </header>
      <div className="metric-grid">
        <Metric label="Accuracy" value={`${accuracy}%`} />
        <Metric label="Attempts" value={totalAttempts.toString()} />
        <Metric label="Points" value={progress.coins.toString()} />
        <Metric label="Streak" value={`${progress.streak} days`} />
      </div>
      <div className="content-grid">
        <section className="panel">
          <h2>Add reward rule</h2>
          <label>
            Points required
            <input value={coins} onChange={(event) => setCoins(event.target.value)} inputMode="numeric" />
          </label>
          <div className="reward-choice-grid compact">
            {rewardOptions.map((option) => (
              <button
                className={option.id === progress.selectedReward ? "active" : ""}
                key={option.id}
                onClick={() => updateProgress({ ...progress, selectedReward: option.id })}
                type="button"
              >
                <strong>{option.shortTitle}</strong>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={addRule}>
            Save reward
          </button>
        </section>
        <section className="panel">
          <h2>Suggested focus</h2>
          <p>
            Start with percentage reasoning, inference, and fair-test science. These are high-transfer skills across
            Australian selective preparation, UK 11+, and US extension standards.
          </p>
        </section>
      </div>
    </section>
  );
}

function normalizeAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join("|").trim().toLowerCase() : answer.trim().toLowerCase();
}

function formatAnswer(answer: string | string[] | undefined) {
  if (!answer) return "";
  return Array.isArray(answer) ? answer.join(", ") : answer;
}

function getAccuracyPercent(correctCount: number, total: number) {
  return total ? Math.round((correctCount / total) * 100) : 0;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function writingWordStatus(text: string) {
  const count = wordCount(text);
  if (count < 100) return `${100 - count} words to target`;
  if (count <= 200) return "Target reached";
  return `${count - 200} words over target`;
}

function isQuestionCorrect(question: Question, selectedAnswer: string) {
  if (question.type === "writing") {
    const count = wordCount(selectedAnswer);
    const lower = selectedAnswer.toLowerCase();
    const hasStructure = ["because", "reason", "example", "therefore", "should"].some((marker) => lower.includes(marker));
    return count >= 100 && count <= 220 && hasStructure;
  }
  return normalizeAnswer(selectedAnswer) === normalizeAnswer(question.correctAnswer);
}

function getCoreMethodTheory(lesson: Lesson) {
  const theoryBySubject: Partial<Record<SubjectId, string>> = {
    math:
      "Good maths answers come from understanding the structure before calculating. First identify what each number represents, then choose a reliable method, then check whether the result makes sense in the question.",
    reading:
      "Strong reading answers are evidence-based. A good reader connects clues across the passage, but never goes beyond what the text can support.",
    language:
      "Language questions test meaning and grammar together. The right answer must fit the sentence logically, sound natural, and match the required word class.",
    writing:
      "Strong writing begins with a controlled plan. A clear position, distinct reasons, and precise evidence make the final response faster to write and easier to mark highly.",
    science:
      "Science thinking starts with cause, evidence, and fair comparison. Change one factor at a time, observe carefully, and make conclusions that match the data.",
    physics:
      "Physics explains motion and energy using models. Identify the forces, transfers, or variables first, then use the model to predict what changes and what stays balanced.",
    reasoning:
      "Reasoning questions reward pattern control. Look for the rule, test it against every part of the problem, and eliminate answers that break the pattern.",
  };

  return theoryBySubject[lesson.subject] ?? "Use the method to understand the idea first, then apply it carefully to the question.";
}

function getLearningFrame(lesson: Lesson) {
  const howBySubject: Partial<Record<SubjectId, string>> = {
    math:
      "Slow down for the first five seconds: read the question, name the structure, choose the operation or model, then check the answer against the original wording.",
    reading:
      "Read once for meaning, then read again for clues. Underline the words that prove your answer before choosing an option.",
    language:
      "Test each option inside the sentence. Check meaning first, then grammar, then whether the whole sentence still sounds fluent.",
    writing:
      "Plan before writing: choose a position, build reasons that are different from each other, and attach evidence to each reason.",
    science:
      "Name the variables, compare the evidence, and write only the conclusion the data can support.",
    physics:
      "Draw or imagine the model first. Mark the forces, energy transfers, or changes, then decide what the model predicts.",
    reasoning:
      "Find the rule, test it in more than one place, and eliminate choices that do not follow the same rule.",
  };

  return {
    what: lesson.summary,
    why: getCoreMethodTheory(lesson),
    how: howBySubject[lesson.subject] ?? "Use a repeatable method: understand the idea, apply it carefully, then check the result.",
  };
}

function getCaseStudyNarrative(lesson: Lesson) {
  const narrativeBySubject: Partial<Record<SubjectId, { realWorld: string; examStyle: string }>> = {
    math: {
      realWorld:
        "School enrolment numbers, suburb populations, budgets, distances, and sports statistics all depend on place value. A student who can read 482,315 as 400,000 + 80,000 + 2,000 + 300 + 10 + 5 can judge size, compare values, and spot unreasonable answers quickly.",
      examStyle:
        "A scholarship or selective-style question may ask for the value of one digit, the expanded form of a large number, or the closest rounded value. The reliable method is to name the place, find the digit value, then compare or round using the highest place that changes the answer.",
    },
    reading: {
      realWorld:
        "News reports, historical sources, biographies, and stories often imply ideas without saying them directly. Strong readers notice small clues such as actions, tone, repeated details, and word choice, then use evidence to explain what is probably true.",
      examStyle:
        "A reading question may include several answers that sound possible. The best answer is the one most strongly supported by the passage, so students must connect clues, reject extreme options, and choose evidence-based inferences.",
    },
    language: {
      realWorld:
        "Clear emails, reports, stories, and essays depend on words that fit both meaning and grammar. A single connective can change the relationship between ideas, such as cause, contrast, time, or condition.",
      examStyle:
        "A cloze question removes one word from a sentence or passage. Students should predict the missing word type, test the meaning of each option, then reread the sentence to check grammar and fluency before choosing.",
    },
    writing: {
      realWorld:
        "Speeches, school proposals, reviews, and opinion articles need a clear position and convincing evidence. Good writers organise their ideas before drafting so each paragraph has a purpose.",
      examStyle:
        "A timed writing prompt rewards planning. Students should turn the prompt into a thesis, choose distinct reasons, attach evidence to each reason, and avoid repeating the same idea in different words.",
    },
    science: {
      realWorld:
        "Plant growth, materials testing, health claims, and environmental questions all require fair evidence. Changing too many factors at once makes it hard to know what caused the result.",
      examStyle:
        "An investigation question may ask for variables, controls, results, or a conclusion. Students should name what changes, what is measured, what stays the same, then write a conclusion that matches the data without overclaiming.",
    },
    physics: {
      realWorld:
        "Bikes, balls, lifts, ramps, speakers, torches, and electrical devices all follow physical rules. Models help students simplify busy real situations into forces, motion, or energy transfers.",
      examStyle:
        "A physics question often starts with a diagram or everyday situation. Students should identify the forces, energy input, useful output, or change in motion before choosing the answer.",
    },
    reasoning: {
      realWorld:
        "Coding, trading charts, timetables, game puzzles, and navigation all use hidden rules. Logical thinkers test a rule across more than one example before trusting it.",
      examStyle:
        "A reasoning question may hide a number pattern, matrix rule, or spatial change. Students should test the rule across every step, track differences or features, and reject choices that break the pattern.",
    },
  };

  const narrative = narrativeBySubject[lesson.subject] ?? {
    realWorld: "This topic appears in real school, reading, problem-solving, and communication tasks.",
    examStyle: "The exam version asks students to apply the idea carefully, explain the method, and avoid tempting traps.",
  };

  return [
    { label: "Real-world case", text: narrative.realWorld },
    { label: "Exam-style case", text: narrative.examStyle },
  ];
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function knowledgeTopicKey(subject: string, topic: string) {
  return `${subject.toLowerCase()}::${topic.toLowerCase()}`;
}

const questKnowledgeTopics: Record<string, Array<{ subject: string; topics: string[] }>> = {
  "quest-week1-day1": [
    {
      subject: "Maths",
      topics: ["place value"],
    },
  ],
  "quest-week1-day2": [
    {
      subject: "Reading",
      topics: ["inference", "text evidence", "best-supported answer"],
    },
  ],
  "quest-week1-day3": [
    {
      subject: "English",
      topics: ["cloze by grammar", "cloze by meaning", "cause connectives", "contrast connectives"],
    },
  ],
  "quest-week1-day4": [
    {
      subject: "Writing",
      topics: ["persuasive writing", "position statements", "planning reasons", "planning evidence"],
    },
  ],
  "quest-week1-day5": [
    {
      subject: "Science",
      topics: ["independent variables", "dependent variables", "control variables", "fair testing"],
    },
  ],
  "quest-week1-day6": [
    {
      subject: "Physics",
      topics: ["balanced forces", "unbalanced forces", "support force", "friction"],
    },
  ],
  "quest-week1-day7": [
    {
      subject: "Reasoning",
      topics: ["number sequences", "changing differences", "alternating rules", "rule testing"],
    },
  ],
  "quest-week2-day1": [
    {
      subject: "Maths",
      topics: ["fraction equivalence", "comparing fractions", "decimal place value", "ratio tables", "scale and maps"],
    },
  ],
  "quest-week2-day2": [
    {
      subject: "Reading",
      topics: ["main idea", "summarising", "theme", "author purpose", "tone"],
    },
  ],
  "quest-week2-day3": [
    {
      subject: "English",
      topics: ["synonyms", "antonyms", "prefixes", "suffixes", "Latin roots", "Greek roots"],
    },
  ],
  "quest-week2-day4": [
    {
      subject: "Writing",
      topics: ["narrative writing", "story mountain", "sensory imagery", "show not tell", "dialogue"],
    },
  ],
  "quest-week2-day5": [
    {
      subject: "Science",
      topics: ["adaptations", "habitats", "food chains", "food webs", "ecosystem change"],
    },
  ],
  "quest-week2-day6": [
    {
      subject: "Physics",
      topics: ["energy transfer", "heat transfer", "conduction", "reflection", "sound vibration"],
    },
  ],
  "quest-week2-day7": [
    {
      subject: "Reasoning",
      topics: ["shape matrices", "rotation", "reflection", "deduction grids", "algorithm steps"],
    },
  ],
};

function completedKnowledgeTopics(completedQuestIds: string[]) {
  const completed = new Set<string>();
  for (const questId of completedQuestIds) {
    for (const item of questKnowledgeTopics[questId] ?? []) {
      for (const topic of item.topics) {
        completed.add(knowledgeTopicKey(item.subject, topic));
      }
    }
  }
  return completed;
}

function questWeek(questId: string) {
  const match = questId.match(/week(\d+)/);
  return match ? Number(match[1]) : 1;
}

function getWeekQuests(week: number) {
  return weeklyQuests.filter((quest) => questWeek(quest.id) === week);
}

function getLearningWeekOptions(completedQuestIds: string[]) {
  const completed = new Set(completedQuestIds);
  const availableWeeks = Array.from(new Set(weeklyQuests.map((quest) => questWeek(quest.id)))).sort((a, b) => a - b);
  if (availableWeeks.length <= 2) return availableWeeks;

  const firstIncompleteIndex = availableWeeks.findIndex((week) => {
    const weekQuests = getWeekQuests(week);
    return weekQuests.some((quest) => !completed.has(quest.id));
  });
  const finalWindowStart = Math.max(0, availableWeeks.length - 2);
  const startIndex =
    firstIncompleteIndex === -1 ? finalWindowStart : Math.min(firstIncompleteIndex, finalWindowStart);

  return availableWeeks.slice(startIndex, startIndex + 2);
}

function buildDailyQuiz(quest: DailyQuest) {
  const selected = quest.questionIds.map((id) => questionMap.get(id)).filter(Boolean) as Question[];
  if (quest.subject === "writing") {
    return selected.filter((question) => question.type === "writing").slice(0, 1);
  }
  const seen = new Set(selected.map((question) => question.id));
  const related = questions.filter(
    (question) => question.subject === quest.subject && !seen.has(question.id)
  );
  const pool = [...selected, ...related];
  if (pool.length >= DAILY_QUIZ_TARGET) return pool.slice(0, DAILY_QUIZ_TARGET);
  const expanded = [...pool];
  let index = 0;
  while (expanded.length < DAILY_QUIZ_TARGET && pool.length > 0) {
    const base = pool[index % pool.length];
    expanded.push({ ...base, id: `${base.id}-practice-${expanded.length + 1}` });
    index += 1;
  }
  return expanded;
}

export default App;
