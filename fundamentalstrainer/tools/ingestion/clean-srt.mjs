#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node tools/ingestion/clean-srt.mjs <input.srt> <output.txt>");
  process.exit(1);
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function removeRepeatedWords(text) {
  const words = normalizeWhitespace(text).split(" ").filter(Boolean);
  const output = [];

  for (let i = 0; i < words.length;) {
    let collapsed = false;

    // Captions often repeat the same phrase 2-3 times inside one cue.
    // Try longer chunks first so "Android itself is open source" collapses as a phrase,
    // not just as individual repeated words.
    for (let size = Math.min(14, Math.floor((words.length - i) / 2)); size >= 2; size--) {
      const chunk = words.slice(i, i + size).join(" ").toLowerCase();
      const next = words.slice(i + size, i + size * 2).join(" ").toLowerCase();
      const third = words.slice(i + size * 2, i + size * 3).join(" ").toLowerCase();

      if (chunk && chunk === next) {
        output.push(...words.slice(i, i + size));
        i += size * (third === chunk ? 3 : 2);
        collapsed = true;
        break;
      }
    }

    if (!collapsed) {
      output.push(words[i]);
      i += 1;
    }
  }

  return output.join(" ");
}

function overlapLength(left, right, maxWords = 18) {
  const leftWords = normalizeWhitespace(left).split(" ").filter(Boolean);
  const rightWords = normalizeWhitespace(right).split(" ").filter(Boolean);
  const max = Math.min(maxWords, leftWords.length, rightWords.length);

  for (let size = max; size >= 3; size--) {
    const leftChunk = leftWords.slice(-size).join(" ").toLowerCase();
    const rightChunk = rightWords.slice(0, size).join(" ").toLowerCase();
    if (leftChunk === rightChunk) return size;
  }

  return 0;
}

function removeCueOverlap(previousText, nextText) {
  const overlap = overlapLength(previousText, nextText);
  if (!overlap) return nextText;
  return normalizeWhitespace(nextText).split(" ").slice(overlap).join(" ");
}

function cleanCueText(lines) {
  return removeRepeatedWords(
    lines
      .map(line => line.replace(/<[^>]+>/g, ""))
      .map(line => line.replace(/\{[^}]+\}/g, ""))
      .map(normalizeWhitespace)
      .filter(Boolean)
      .join(" ")
  );
}

const raw = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "").replace(/\r/g, "");
const blocks = raw.split(/\n{2,}/);
const cues = [];

for (const block of blocks) {
  const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
  const textLines = lines
    .filter(line => !/^\d+$/.test(line))
    .filter(line => !/^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}/.test(line));

  let text = cleanCueText(textLines);
  if (!text) continue;

  const previous = cues.at(-1);
  if (previous && previous.toLowerCase() === text.toLowerCase()) continue;
  if (previous) text = removeCueOverlap(previous, text);
  if (!text) continue;
  cues.push(text);
}

const cleanedBody = removeRepeatedWords(cues.join(" "));
const text = cleanedBody
  .replace(/\s+/g, " ")
  .replace(/([.!?])\s+/g, "$1\n\n")
  .trim() + "\n";

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, text, "utf8");
console.log(`Cleaned transcript written to ${outputPath}`);
console.log(`Cleaned ${cues.length} caption cue(s).`);
