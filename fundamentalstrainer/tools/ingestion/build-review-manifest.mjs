import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const pendingDir = 'data/imports/pending';
const manifestPath = join(pendingDir, 'manifest.json');

async function main() {
  const entries = await readdir(pendingDir);
  const imports = [];

  for (const entry of entries.sort()) {
    if (!entry.endsWith('.json') || entry === 'manifest.json') continue;
    const filePath = join(pendingDir, entry);
    const raw = await readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    imports.push({
      id: data.id,
      label: `${data.lessonId || 'Lesson'} • ${data.id} • ${data.candidates?.length || 0} candidates`,
      path: `./${filePath.replaceAll('\\', '/')}`,
      certificationId: data.certificationId,
      lessonId: data.lessonId,
      candidateCount: data.candidates?.length || 0,
      status: data.status
    });
  }

  await writeFile(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), imports }, null, 2));
  console.log(`Review manifest written to ${manifestPath} with ${imports.length} pending import(s).`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
