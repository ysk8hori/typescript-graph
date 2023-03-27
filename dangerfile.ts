import { danger, markdown, warn } from 'danger';
import { execSync } from 'child_process';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

const fileName = './typescript-graph.md';
execSync(`tsg --md "${fileName}"`);

markdown('hoge', fileName);
