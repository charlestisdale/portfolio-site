#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node tools/ingestion/clean-srt.mjs <input.srt> <output.txt>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const lines = raw
  .replace(/\r/g, "")
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .filter(line => !/^\d+$/.test(line))
  .filter(line => !/^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}/.test(line));

const text = lines
  .join(" ")
  .replace(/\s+/g, " ")
  .replace(/([.!?])\s+/g, "$1\n\n")
  .trim() + "\n";

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, text, "utf8");
console.log(`Cleaned transcript written to ${outputPath}`);
