// Turns reports/cucumber.json into a Markdown summary (scenario by scenario,
// its notes, the failing step and its error) for the GitHub run page.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

type Embedding = { data: string; mime_type: string };
type Step = { keyword: string; name?: string; embeddings?: Embedding[]; result: { status: string; error_message?: string } };
type Scenario = { name: string; steps: Step[] };
type Feature = { name: string; elements: Scenario[] };

const icon: Record<string, string> = { passed: '✅', failed: '❌', skipped: '⏭️', undefined: '❓', pending: '⏸️' };

const file = 'reports/cucumber.json';
if (!existsSync(file)) {
  console.log('No reports/cucumber.json: the run did not start.');
  process.exit(0);
}
const features = JSON.parse(readFileSync(file, 'utf8')) as Feature[];

// `this.log()` lines; the JSON formatter always stores them base64-encoded.
const notes = (steps: Step[]) =>
  steps.flatMap((s) =>
    (s.embeddings ?? [])
      .filter((e) => e.mime_type.startsWith('text/x.cucumber.log'))
      .map((e) => Buffer.from(e.data, 'base64').toString('utf8')),
  );

const count = { passed: 0, failed: 0, skipped: 0 };
const lines: string[] = [];
for (const feature of features) {
  lines.push(`#### ${feature.name}`, '');
  for (const scenario of feature.elements) {
    const steps = scenario.steps.filter((s) => !['After', 'Before'].includes(s.keyword.trim()));
    const failed = scenario.steps.find((s) => s.result.status === 'failed');
    const state = failed ? 'failed' : steps.some((s) => s.result.status !== 'passed') ? 'skipped' : 'passed';
    count[state]++;
    lines.push(`${icon[state]} **${scenario.name}**`, '');
    for (const s of steps) lines.push(`- ${icon[s.result.status] ?? s.result.status} ${s.keyword.trim()} ${s.name ?? ''}`);
    const said = notes(scenario.steps);
    if (said.length) lines.push('', ...said.map((n) => `> ${n}`));
    if (failed?.result.error_message) {
      lines.push('', '```', failed.result.error_message.split('\n').slice(0, 6).join('\n'), '```');
    }
    lines.push('');
  }
}

const title = `### E2E against pollar.dev: ${count.passed} passed, ${count.failed} failed, ${count.skipped} skipped`;
const md = [title, '', ...lines].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
else console.log(md);
