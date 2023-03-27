import { danger, message, warn } from 'danger';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

const fileName = './typescript-graph.md';
execSync(`npx tsg --md "${fileName}" --LR`);
const graphString = readFileSync(fileName, 'utf8');
message(graphString);
