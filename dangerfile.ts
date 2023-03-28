import { danger, message, warn } from 'danger';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

const modified = danger.git.modified_files;
const created = danger.git.created_files;
const deleted = danger.git.deleted_files;

const fileName = './typescript-graph.md';
execSync(
  `npx tsg --md "${fileName}" --LR --include ${modified.join(
    ' ',
  )} ${created.join(' ')} ${deleted.join(
    ' ',
  )} --exclude node_modules --highlight ${modified.join(' ')} ${created.join(
    ' ',
  )} ${deleted.join(' ')}`,
);
const graphString = readFileSync(fileName, 'utf8');
message(graphString);
