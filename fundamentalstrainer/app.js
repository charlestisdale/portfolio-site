import { KnowledgeEngine } from "./engine/knowledge/index.js";
import { renderLearnMode } from "./engine/modes/learn.js";
import { JobRunner, JobType } from "./engine/jobs/index.js";
import { JobActivityPanel } from "./engine/jobs/job-activity-panel.js";

const certificationId = "a-plus-220-1202";
const knowledge = new KnowledgeEngine();
const jobs = createBrowserJobRunner();
let activeConceptId = null;

const searchBox = document.querySelector("#searchBox");
const results = document.querySelector("#results");
const conceptView = document.querySelector("#conceptView");
const platformStats = document.querySelector("#platformStats");
const relatedView = document.querySelector("#relatedView");
const commandView = document.querySelector("#commandView");
const jobsActivity = document.querySelector("#jobsActivity");

async function loadPlatform() {
  await knowledge.loadCertification(certificationId);
  renderStats();
  renderResults(knowledge.search(""));
  renderCommands();
  startJobsActivityPanel();

  const hashConceptId = readConceptIdFromHash();
  const first = knowledge.all()[0];
  const initialConceptId = knowledge.get(hashConceptId) ? hashConceptId : first?.id;
  if (initialConceptId) renderConcept(initialConceptId, { updateHash: !hashConceptId });
}

function renderStats() {
  const stats = knowledge.statistics();
  platformStats.innerHTML = `
    <div><strong>${stats.knowledgeObjects}</strong><span>Knowledge Objects</span></div>
    <div><strong>${stats.relationships}</strong><span>Graph Edges</span></div>
    <div><strong>${stats.commands}</strong><span>Commands</span></div>
    <div><strong>${stats.pbqIdeas}</strong><span>PBQ Seeds</span></div>
  `;
}

function renderResults(searchResults) {
  const rows = searchResults.map(result => result.object || result);

  results.innerHTML = rows.map(item => `
    <button class="result ${item.id === activeConceptId ? "active" : ""}" data-id="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong><br />
      <span>${escapeHtml(item.id)}</span>
    </button>
  `).join("");
}

function renderConcept(id, { updateHash = true } = {}) {
  const concept = knowledge.get(id);
  if (!concept) return;

  activeConceptId = id;
  const relatedEdges = knowledge.related(id);
  const lessonContext = resolvePrimaryLessonContext(concept);
  const objectiveContext = resolveObjectiveContext(concept);

  conceptView.innerHTML = renderLearnMode({
    concept,
    relatedEdges,
    lessonContext,
    objectiveContext
  });

  renderRelated(id);
  renderResults(knowledge.search(searchBox.value));

  if (updateHash) {
    history.replaceState(null, "", `#learn=${encodeURIComponent(id)}`);
  }
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
    .flatMap(mapping => mapping.objectives || [])
    .map(objective => knowledge.objective(objective.id))
    .filter(item => item.objective);
}

function renderRelated(id) {
  const edges = knowledge.related(id);

  if (!edges.length) {
    relatedView.innerHTML = "<p>No graph relationships yet.</p>";
    return;
  }

  relatedView.innerHTML = edges.map(edge => {
    const neighbor = edge.directionFromSource === "outbound" ? edge.target : edge.source;
    const missing = edge.directionFromSource === "outbound" ? edge.targetId : edge.sourceId;
    return `
      <button class="result" ${neighbor ? `data-id="${escapeHtml(neighbor.id)}"` : "disabled"}>
        <strong>${escapeHtml(edge.type)}</strong>: ${escapeHtml(neighbor?.title || missing)}<br />
        <span>${escapeHtml(edge.notes || edge.strength || "")}</span>
      </button>
    `;
  }).join("");
}

function renderCommands() {
  const commands = knowledge.commands();
  commandView.innerHTML = commands.length ? commands.map(command => `
    <li><code>${escapeHtml(command.command)}</code> — ${escapeHtml(command.purpose)} <span class="pill">${escapeHtml(command.title)}</span></li>
  `).join("") : "<li>No commands loaded yet.</li>";
}

function startJobsActivityPanel() {
  const panel = new JobActivityPanel({
    root: jobsActivity,
    runner: jobs,
    onSeedDemoJobs: enqueueDemoJobs
  });

  panel.start();
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
}

function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function readConceptIdFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("learn");
}

searchBox.addEventListener("input", () => renderResults(knowledge.search(searchBox.value)));

results.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  renderConcept(button.dataset.id);
});

relatedView.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  renderConcept(button.dataset.id);
});

conceptView.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  renderConcept(button.dataset.id);
});

window.addEventListener("hashchange", () => {
  const conceptId = readConceptIdFromHash();
  if (conceptId && conceptId !== activeConceptId) renderConcept(conceptId, { updateHash: false });
});

loadPlatform().catch(error => {
  conceptView.innerHTML = `<pre>${escapeHtml(error.stack || error.message)}</pre>`;
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
