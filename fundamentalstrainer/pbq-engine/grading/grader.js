export function gradeRequiredStateScenario({ scenario = {}, state = {} } = {}) {
  const grading = scenario.grading || {};
  const requiredStates = grading.requiredStates || [];
  const flags = state.flags || {};
  const penalties = state.penalties || [];
  const maxScore = Number(grading.maxScore || 100);
  const passingScore = Number(grading.passingScore || 75);
  const pointsPerMissingState = Number(grading.pointsPerMissingState || 15);

  const missing = requiredStates.filter(item => flags[item.key] !== item.value);
  const missingPenalty = missing.length * pointsPerMissingState;
  const actionPenalty = penalties.reduce((total, item) => total + Number(item.points || 0), 0);
  const score = Math.max(0, maxScore - missingPenalty - actionPenalty);
  const passed = score >= passingScore && missing.length === 0;

  return {
    score,
    passed,
    maxScore,
    passingScore,
    missing,
    penalties,
    missingPenalty,
    actionPenalty,
    summary: grading.summary || scenario.note || "Review the scenario evidence, actions, documentation, and required outcomes."
  };
}
