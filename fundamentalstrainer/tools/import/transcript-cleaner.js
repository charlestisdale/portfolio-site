const TIMESTAMP_RANGE = /^(\d{2}:\d{2}:\d{2},\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2},\d{3})/;
const SEQUENCE_NUMBER = /^\d+$/;

/**
 * Parse an SRT transcript into timestamped caption blocks.
 * This keeps the original timing metadata so later import reports can point back
 * to the source transcript instead of losing traceability.
 */
export function parseSrt(srtText) {
  if (typeof srtText !== "string") {
    throw new TypeError("parseSrt expected transcript text.");
  }

  const normalized = srtText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    let cursor = 0;
    let sequence = null;

    if (SEQUENCE_NUMBER.test(lines[cursor] || "")) {
      sequence = Number(lines[cursor]);
      cursor += 1;
    }

    const timing = lines[cursor] || "";
    const match = timing.match(TIMESTAMP_RANGE);
    if (!match) {
      return {
        sequence: sequence ?? index + 1,
        startTime: null,
        endTime: null,
        text: cleanCaptionText(lines.slice(cursor).join(" ")),
        malformed: true
      };
    }

    cursor += 1;
    return {
      sequence: sequence ?? index + 1,
      startTime: match[1],
      endTime: match[2],
      text: cleanCaptionText(lines.slice(cursor).join(" ")),
      malformed: false
    };
  }).filter(block => block.text.length > 0);
}

/**
 * Convert timestamped caption blocks into readable transcript paragraphs.
 * Captions are grouped into windows so concept extraction can work from context
 * instead of individual subtitle fragments.
 */
export function cleanTranscript(srtText, options = {}) {
  const {
    sourceFile = null,
    lessonId = null,
    lessonTitle = null,
    maxWordsPerSegment = 130
  } = options;

  const captions = parseSrt(srtText);
  const segments = [];
  let current = null;

  for (const caption of captions) {
    if (!current) {
      current = createSegment(caption);
      continue;
    }

    const nextWordCount = current.wordCount + countWords(caption.text);
    if (nextWordCount > maxWordsPerSegment) {
      segments.push(finalizeSegment(current));
      current = createSegment(caption);
    } else {
      current.endTime = caption.endTime || current.endTime;
      current.captionSequences.push(caption.sequence);
      current.text = joinSentences(current.text, caption.text);
      current.wordCount = nextWordCount;
    }
  }

  if (current) segments.push(finalizeSegment(current));

  return {
    sourceFile,
    lessonId,
    lessonTitle,
    captionCount: captions.length,
    malformedCaptionCount: captions.filter(caption => caption.malformed).length,
    segments
  };
}

function createSegment(caption) {
  return {
    startTime: caption.startTime,
    endTime: caption.endTime,
    captionSequences: [caption.sequence],
    text: caption.text,
    wordCount: countWords(caption.text)
  };
}

function finalizeSegment(segment) {
  return {
    startTime: segment.startTime,
    endTime: segment.endTime,
    captionSequences: segment.captionSequences,
    text: normalizeWhitespace(segment.text),
    wordCount: segment.wordCount
  };
}

function cleanCaptionText(text) {
  return normalizeWhitespace(String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\[[^\]]+\]/g, " "));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function joinSentences(left, right) {
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}

function countWords(text) {
  return normalizeWhitespace(text).split(" ").filter(Boolean).length;
}
