import { cleanTranscript } from "./transcript-cleaner.js";
import { extractCandidateConcepts } from "./concept-extractor.js";
import { detectDuplicateCandidates } from "./duplicate-detector.js";
import { suggestRelationships } from "./relationship-suggester.js";
import { buildImportReport } from "./import-report.js";

/**
 * Run the import-review pipeline for one transcript.
 *
 * This function returns an import report. It does not write directly to the
 * knowledge base because every imported concept must be reviewed first.
 */
export function runTranscriptImportPipeline({
  srtText,
  existingObjects = [],
  sourceFile = null,
  lessonId = null,
  lessonTitle = null,
  certificationId = "a-plus-220-1202",
  examCode = "220-1202",
  domainHints = [],
  idStyle = "dot"
}) {
  const options = {
    certificationId,
    examCode,
    domainHints,
    idStyle
  };

  const cleanedTranscript = cleanTranscript(srtText, {
    sourceFile,
    lessonId,
    lessonTitle
  });

  const extracted = extractCandidateConcepts(cleanedTranscript, options);
  const withDuplicates = detectDuplicateCandidates(extracted, existingObjects);
  const withRelationships = suggestRelationships(withDuplicates, existingObjects);

  return buildImportReport({
    cleanedTranscript,
    candidates: withRelationships,
    existingObjects,
    options
  });
}

export {
  cleanTranscript,
  extractCandidateConcepts,
  detectDuplicateCandidates,
  suggestRelationships,
  buildImportReport
};
