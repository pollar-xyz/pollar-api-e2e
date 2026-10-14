// Turns reports/cucumber.json into a Markdown summary (scenario by scenario,
// the failing step and its error) for the GitHub run page.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

type Step = { keyword: string; name: string; result: { status: string; error_message?: string } };
type Scenario = { name: string; steps: Step[] };
type Feature = { name: string; elements: Scenario[] };

const icon: Record<string, string> = { passed: '✅', failed: '❌', skipped: '⏭️', undefined: '❓', pending: '⏸️' };

const file = 'reports/cucumber.json';
if (!existsSync(file)) {
  console.log('No reports/cucumber.json: the run did not start.');
  process.exit(0);
}
const features = JSON.parse(readFileSync(file, 'utf8')) as Feature[];

let passed = 0;
let failed = 0;
const lines: string[] = [];
for (const feature of features) {
  lines.push(`#### ${feature.name}`, '');
  for (const scenario of feature.elements) {
    const steps = scenario.steps.filter((s) => s.keyword.trim() !== 'After' && s.keyword.trim() !== 'Before');
    const bad = steps.find((s) => s.result.status !== 'passed');
    bad ? failed++ : passed++;
    lines.push(`${bad ? '❌' : '✅'} **${scenario.name}**`, '');
    for (const s of steps) lines.push(`- ${icon[s.result.status] ?? s.result.status} ${s.keyword.trim()} ${s.name}`);
    if (bad?.result.error_message) {
      lines.push('', '```', bad.result.error_message.split('\n').slice(0, 6).join('\n'), '```');
    }
    lines.push('');
  }
}

const md = [`### E2E against pollar.dev: ${passed} passed, ${failed} failed`, '', ...lines].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
else console.log(md);
