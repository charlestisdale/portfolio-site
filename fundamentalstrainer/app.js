import { KnowledgeEngine } from "./engine/knowledge/index.js";
import { renderLearnMode } from "./engine/modes/learn.js";
import { renderSearchControls, renderSearchResults } from "./engine/modes/search-mode.js";
import { renderDashboardMode } from "./engine/modes/dashboard-mode.js";
import { renderAssessmentMode } from "./engine/modes/assessment-mode.js";
import { renderGraphMode } from "./engine/modes/graph-mode.js";
import { renderStudyPathMode } from "./engine/modes/study-path-mode.js";
import { buildStudyPath } from "./engine/study-paths/index.js";
import { buildRecommendations } from "./engine/recommendations/index.js";
import { generateAssessmentFromKnowledge, gradeAssessment, LocalAssessmentAttemptStore } from "./engine/assessment/index.js";
import { LocalProgressStore } from "./engine/progress/index.js";
import { JobRunner } from "./engine/jobs/job-runner.js";
import { JobType } from "./engine/jobs/job-types.js";
import { JobActivityPanel } from "./engine/jobs/job-activity-panel.js";

const certificationId = "a-plus-220-1202";
const knowledge = new KnowledgeEngine();
const progressStore = new LocalProgressStore();
const assessmentAttemptStore = new LocalAssessmentAttemptStore();
const jobs = createBrowserJobRunner();
let activeConceptId = null;
let searchFilters = {};
let activeMode = getDefaultMode();
let certificationState = null;
let jobActivityPanel = null;
let currentAssessment = null;
let assessmentAnswers = {};
let currentAssessmentGrade = null;
let currentAttemptSaved = false;

const searchBox = document.querySelector("#searchBox");
const results = document.querySelector("#results");
const conceptView = document.querySelector("#conceptView");
const dashboardView = document.querySelector("#dashboardView");
const studyPathView = document.querySelector("#studyPathView");
const assessmentView = document.querySelector("#assessmentView");
const platformStats = document.querySelector("#platformStats");
const relatedView = document.querySelector("#relatedView");
const commandView = document.querySelector("#commandView");
const jobsActivity = document.querySelector("#jobsActivity");
const modeTabs = [...document.querySelectorAll("[data-mode-target]")];
const modePanels = [...document.querySelectorAll("[data-mode-panel]")];

async function loadPlatform() {
  await knowledge.loadCertification(certificationId);
  certificationState = knowledge.certification(certificationId);
  renderStats();
  renderSearch();
  renderCommands();
  renderAssessment();
  renderGraph();
  renderStudyPath();
  startJobsActivityPanel();

  const hashState = readHashState();
  const first = knowledge.all()[0];
  const initialConceptId = knowledge.get(hashState.learn) ? hashState.learn : first?.id;
  if (initialConceptId) renderConcept(initialConceptId, { updateHash: false, switchMode: false });
  renderDashboard();
  setMode(hashState.mode || getDefaultMode(), { updateHash: false });
}

function renderStats() {
  if (!platformStats) return;
  const stats = knowledge.statistics();
  platformStats.innerHTML = `
    <div><strong>${stats.knowledgeObjects}</strong><span>Knowledge Objects</span></div>
    <div><strong>${stats.relationships}</strong><span>Graph Edges</span></div>
    <div><strong>${stats.commands}</strong><span>Commands</span></div>
    <div><strong>${stats.pbqIdeas}</strong><span>PBQ Seeds</span></div>
  `;
}

function renderDashboard() {
  if (!dashboardView) return;

  dashboardView.innerHTML = renderDashboardMode({
    certificationState,
    stats: knowledge.statistics(),
    activeConcept: knowledge.get(activeConceptId),
    activeProgress: activeConceptId ? progressStore.get(activeConceptId) : null,
    progressSummary: progressStore.summarize(knowledge.all()),
    assessmentSummary: assessmentAttemptStore.summarize(),
    recommendations: buildRecommendations({
      certificationState,
      knowledgeEngine: knowledge,
      progressStore,
      activeConceptId,
      limit: 4
    }),
    jobs: jobs.list()
  });
}

function renderSearch() {
  if (!searchBox || !results) return;

  const searchResults = knowledge.search(searchBox.value, { filters: searchFilters });
  results.innerHTML = `
    ${renderSearchControls({ objects: knowledge.all(), filters: searchFilters })}
    ${renderSearchResults({
      query: searchBox.value,
      results: searchResults,
      totalObjects: knowledge.all().length,
      filters: searchFilters
    })}
  `;
}

function renderAssessment() {
  if (!assessmentView) return;
  assessmentView.innerHTML = renderAssessmentMode({
    assessment: currentAssessment,
    answers: assessmentAnswers,
    grade: currentAssessmentGrade,
    attempts: assessmentAttemptStore.list({ limit: 5 }),
    attemptSummary: assessmentAttemptStore.summarize()
  });
}

function renderGraph() {
  if (!relatedView) return;

  const activeConcept = activeConceptId ? knowledge.get(activeConceptId) : null;
  relatedView.innerHTML = renderGraphMode({
    activeConcept,
    edges: activeConceptId ? knowledge.related(activeConceptId) : [],
    stats: knowledge.statistics(),
    graph: knowledge.graph()
  });
}

function renderStudyPath() {
  if (!studyPathView) return;

  studyPathView.innerHTML = renderStudyPathMode({
    path: buildStudyPath({
      certificationState,
      knowledgeEngine: knowledge,
      progressStore
    })
  });
}

function generateAssessment() {
  currentAssessment = generateAssessmentFromKnowledge(knowledge.all(), { limit: 10 });
  assessmentAnswers = {};
  currentAssessmentGrade = null;
  currentAttemptSaved = false;
  renderAssessment();
}

function selectAssessmentAnswer(questionId, answerId) {
  assessmentAnswers = {
    ...assessmentAnswers,
    [questionId]: answerId
  };
  currentAssessmentGrade = null;
  currentAttemptSaved = false;
  renderAssessment();
}

function gradeCurrentAssessment() {
  if (!currentAssessment) return;
  currentAssessmentGrade = gradeAssessment(currentAssessment.questions, assessmentAnswers);

  if (!currentAttemptSaved) {
    assessmentAttemptStore.saveAttempt({
      assessment: currentAssessment,
      answers: assessmentAnswers,
      grade: currentAssessmentGrade,
      mode: "practice"
    });
    currentAttemptSaved = true;
  }

  renderAssessment();
  renderDashboard();
}

function clearAssessmentHistory() {
  assessmentAttemptStore.clear();
  renderAssessment();
  renderDashboard();
}

function renderConcept(id, { updateHash = true, switchMode = true } = {}) {
  const concept = knowledge.get(id);
  if (!concept || !conceptView) return;

  activeConceptId = id;
  const relatedEdges = knowledge.related(id);
  const lessonContext = resolvePrimaryLessonContext(concept);
  const objectiveContext = resolveObjectiveContext(concept);

  conceptView.innerHTML = renderLearnMode({
    concept,
    relatedEdges,
    lessonContext,
    objectiveContext,
    progress: progressStore.get(id)
  });

  renderGraph();
  renderSearch();
  renderDashboard();
  renderStudyPath();

  if (switchMode) setMode(getPanelExists("learn") ? "learn" : getDefaultMode(), { updateHash: false });
  if (updateHash) writeHashState({ mode: activeMode, learn: id });
}

function updateConceptProgress(knowledgeId, action) {
  if (!knowledge.get(knowledgeId)) return;

  if (action === "reset") progressStore.reset(knowledgeId);
  else progressStore.cycleStatus(knowledgeId);

  renderConcept(knowledgeId, { updateHash: true, switchMode: false });
  renderDashboard();
  renderStudyPath();
}

function resolvePrimaryLessonContext(concept) {
  const lessonMapping = (concept.certificationMappings || [])
    .flatMap(mapping => mapping.lessons || [])
    .find(Boolean);

  if (!lessonMapping) return null;
  return knowledge.lesson(lessonMapping.lessonId || lessonMapping.id || lessonMapping.order);
}

function resolveObjectiveContext(concept) {
  return (concept.certificationMappings || [])
    .flatMap(mapping => (mapping.objectives || []).map(objective => ({ objective, certification: mapping.certification })))
    .map(({ objective, certification }) => {
      const id = String(objective.id || "");
      const resolvedId = knowledge.objective(id).objective ? id : `${certification}.${id}`;
      return knowledge.objective(resolvedId);
    })
    .filter(item => item.objective);
}

function renderCommands() {
  if (!commandView) return;

  const commands = knowledge.commands();
  commandView.innerHTML = commands.length ? commands.map(command => `
    <li><code>${escapeHtml(command.command)}</code> — ${escapeHtml(command.purpose)} <span class="pill">${escapeHtml(command.title)}</span></li>
  `).join("") : "<li>No commands loaded yet.</li>";
}

function setMode(mode, { updateHash = true } = {}) {
  const validMode = getPanelExists(mode) ? mode : getDefaultMode();
  activeMode = validMode;

  if (validMode === "dashboard") renderDashboard();
  if (validMode === "assessment") renderAssessment();
  if (validMode === "graph") renderGraph();
  if (validMode === "path") renderStudyPath();

  for (const tab of modeTabs) {
    tab.classList.toggle("active", tab.dataset.modeTarget === validMode);
    tab.setAttribute("aria-selected", String(tab.dataset.modeTarget === validMode));
  }

  for (const panel of modePanels) {
    panel.classList.toggle("active", panel.dataset.modePanel === validMode);
  }

  if (updateHash) writeHashState({ mode: validMode, learn: activeConceptId });
}

function getPanelExists(mode) {
  return modePanels.some(panel => panel.dataset.modePanel === mode);
}

function getDefaultMode() {
  const panels = [...document.querySelectorAll("[data-mode-panel]")];
  if (panels.some(panel => panel.dataset.modePanel === "dashboard")) return "dashboard";
  if (panels.some(panel => panel.dataset.modePanel === "learn")) return "learn";
  return panels[0]?.dataset.modePanel || "learn";
}

function startJobsActivityPanel() {
  if (!jobsActivity || jobActivityPanel) return;

  jobActivityPanel = new JobActivityPanel({
    root: jobsActivity,
    runner: jobs,
    onSeedDemoJobs: () => {
      enqueueDemoJobs();
      renderDashboard();
    }
  });

  jobActivityPanel.start();
}

function createBrowserJobRunner() {
  const runner = new JobRunner({ concurrency: 2 });

  runner.register(JobType.VALIDATION_RUN, async (payload, context) => {
    await runSteppedJob(context, [
      "Loading validation rules",
      "Checking knowledge object schemas",
      "Checking relationship integrity",
      "Building validation summary"
    ]);

    return {
      warnings: payload.expectedWarnings ?? 0,
      message: "Validation completed in browser demo mode."
    };
  });

  runner.register(JobType.SEARCH_INDEX_REBUILD, async (payload, context) => {
    await runSteppedJob(context, [
      "Reading knowledge objects",
      "Tokenizing searchable fields",
      "Writing in-memory index",
      "Refreshing search metadata"
    ]);

    return {
      indexedObjects: knowledge.all().length,
      message: "Search index rebuild completed in browser demo mode."
    };
  });

  runner.register(JobType.GRAPH_REBUILD, async (payload, context) => {
    await runSteppedJob(context, [
      "Reading relationship files",
      "Resolving source and target nodes",
      "Checking orphaned edges",
      "Publishing graph cache"
    ]);

    return {
      relationships: knowledge.statistics().relationships,
      message: "Graph rebuild completed in browser demo mode."
    };
  });

  runner.register(JobType.MERGE_PLAN_APPLY, async (payload, context) => {
    await runSteppedJob(context, [
      "Loading merge plan",
      "Preparing dry-run filesystem writes"
    ]);

    const currentJob = context.getJob();
    if (payload.shouldFail && currentJob.attempts.current === 1) {
      context.log("error", "Demo merge apply intentionally failed so retry can be tested.");
      throw new Error("Demo merge apply failed. Use Retry to requeue it.");
    }

    return { message: "Merge plan applied in browser demo mode." };
  });

  return runner;
}

function enqueueDemoJobs() {
  jobs.enqueue({
    type: JobType.VALIDATION_RUN,
    title: "Validate knowledge base",
    payload: { expectedWarnings: 3 }
  });

  jobs.enqueue({
    type: JobType.SEARCH_INDEX_REBUILD,
    title: "Rebuild search index"
  });

  jobs.enqueue({
    type: JobType.GRAPH_REBUILD,
    title: "Rebuild knowledge graph"
  });

  jobs.enqueue({
    type: JobType.MERGE_PLAN_APPLY,
    title: "Apply reviewed merge plan",
    payload: { shouldFail: true }
  });
}

async function runSteppedJob(context, steps) {
  context.throwIfCanceled();
  context.progress({ current: 0, total: steps.length, label: steps[0] || "Starting" });

  for (const [index, step] of steps.entries()) {
    context.throwIfCanceled();
    context.log("info", step);
    await sleep(450);
    context.throwIfCanceled();
    context.progress({ current: index + 1, total: steps.length, label: step });
  }

  renderDashboard();
}

function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function readHashState() {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return {
    mode: params.get("mode"),
    learn: params.get("learn")
  };
}

function writeHashState({ mode = activeMode, learn = activeConceptId } = {}) {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (learn) params.set("learn", learn);
  history.replaceState(null, "", `#${params.toString()}`);
}

function updateSearchFilter(name, value) {
  searchFilters = {
    ...searchFilters,
    [name]: value || undefined
  };

  searchFilters = Object.fromEntries(Object.entries(searchFilters).filter(([, filterValue]) => Boolean(filterValue)));
  renderSearch();
}

modeTabs.forEach(tab => {
  tab.addEventListener("click", () => setMode(tab.dataset.modeTarget));
});

if (dashboardView) {
  dashboardView.addEventListener("click", event => {
    const modeJump = event.target.closest("button[data-mode-jump]");
    if (modeJump) {
      setMode(modeJump.dataset.modeJump);
      return;
    }

    const domainButton = event.target.closest("button[data-dashboard-domain]");
    if (domainButton) {
      searchFilters = { domain: domainButton.dataset.dashboardDomain };
      if (searchBox) searchBox.value = "";
      renderSearch();
      setMode("search");
      return;
    }

    const conceptButton = event.target.closest("button[data-id]");
    if (!conceptButton) return;
    renderConcept(conceptButton.dataset.id);
  });
}

if (studyPathView) {
  studyPathView.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    renderConcept(button.dataset.id);
    setMode("learn");
  });
}

if (assessmentView) {
  assessmentView.addEventListener("click", event => {
    const actionButton = event.target.closest("button[data-assessment-action]");
    if (actionButton?.dataset.assessmentAction === "generate") {
      generateAssessment();
      return;
    }

    if (actionButton?.dataset.assessmentAction === "grade") {
      gradeCurrentAssessment();
      return;
    }

    if (actionButton?.dataset.assessmentAction === "clear-history") {
      clearAssessmentHistory();
      return;
    }

    const answerButton = event.target.closest("button[data-assessment-question][data-assessment-answer]");
    if (!answerButton) return;
    selectAssessmentAnswer(answerButton.dataset.assessmentQuestion, answerButton.dataset.assessmentAnswer);
  });
}

if (searchBox) searchBox.addEventListener("input", () => renderSearch());

if (results) {
  results.addEventListener("click", event => {
    const resetButton = event.target.closest("button[data-search-reset]");
    if (resetButton) {
      searchFilters = {};
      if (searchBox) searchBox.value = "";
      renderSearch();
      return;
    }

    const button = event.target.closest("button[data-id]");
    if (!button) return;
    renderConcept(button.dataset.id);
  });

  results.addEventListener("change", event => {
    const filter = event.target.closest("select[data-search-filter]");
    if (!filter) return;
    updateSearchFilter(filter.dataset.searchFilter, filter.value);
  });
}

if (relatedView) {
  relatedView.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    renderConcept(button.dataset.id);
    setMode("learn");
  });
}

if (conceptView) {
  conceptView.addEventListener("click", event => {
    const progressButton = event.target.closest("button[data-progress-action]");
    if (progressButton) {
      updateConceptProgress(progressButton.dataset.id, progressButton.dataset.progressAction);
      return;
    }

    const button = event.target.closest("button[data-id]");
    if (!button) return;
    renderConcept(button.dataset.id);
  });
}

window.addEventListener("hashchange", () => {
  const hashState = readHashState();
  if (hashState.learn && hashState.learn !== activeConceptId) {
    renderConcept(hashState.learn, { updateHash: false, switchMode: false });
  }
  if (hashState.mode && hashState.mode !== activeMode) setMode(hashState.mode, { updateHash: false });
});

loadPlatform().catch(error => {
  const errorTarget = conceptView || dashboardView || document.querySelector("main") || document.body;
  errorTarget.innerHTML = `<pre>${escapeHtml(error.stack || error.message)}</pre>`;
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
