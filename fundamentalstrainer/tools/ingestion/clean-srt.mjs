#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node tools/ingestion/clean-srt.mjs <input.srt> <output.txt>");
  process.exit(1);
}

function normalizeLine(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCueNumber(line) {
  return /^\d+$/.test(line.trim());
}

function isTimestamp(line) {
  return /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(line.trim());
}

function parseLosslessSrt(raw) {
  const blocks = String(raw || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split(/\n{2,}/);

  const cues = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    const textLines = lines
      .filter(line => !isCueNumber(line))
      .filter(line => !isTimestamp(line))
      .map(normalizeLine)
      .filter(Boolean);

    if (textLines.length) cues.push(textLines.join(" "));
  }

  return cues.join("\n").trim() + "\n";
}

const raw = fs.readFileSync(inputPath, "utf8");
const text = parseLosslessSrt(raw);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, text, "utf8");
console.log(`Lossless transcript written to ${outputPath}`);
console.log("Removed only SRT cue numbers, timestamps, and markup. Did not collapse repeated words or overlapping cues.");
