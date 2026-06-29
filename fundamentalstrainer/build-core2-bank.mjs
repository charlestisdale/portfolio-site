import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, "core2-bank");
const outputFile = path.join(__dirname, "core2-questions.json");

const sourceFiles = [
  "1-operating-systems.json",
  "2-security.json",
  "3-software-troubleshooting.json",
  "4-operational-procedures.json"
];

const requiredFields = [
  "exam",
  "objective",
  "category",
  "difficulty",
  "question",
  "answer",
  "options",
  "note"
];

function readQuestions(fileName) {
  const filePath = path.join(sourceDir, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }

  return parsed.map((question, index) => validateQuestion(question, fileName, index));
}

function validateQuestion(question, fileName, index) {
  const label = `${fileName} item ${index + 1}`;

  for (const field of requiredFields) {
    if (!(field in question)) {
      throw new Error(`${label} is missing required field: ${field}`);
    }
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`${label} must include at least two answer options.`);
  }

  if (!question.options.includes(question.answer)) {
    throw new Error(`${label} answer must exactly match one option.`);
  }

  return question;
}

const questions = sourceFiles.flatMap(readQuestions);

fs.writeFileSync(outputFile, `${JSON.stringify(questions, null, 2)}\n`);

console.log(`Built ${path.relative(process.cwd(), outputFile)} with ${questions.length} questions.`);
