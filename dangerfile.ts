import { danger, markdown, warn } from 'danger';
import { $ } from 'zx';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

const fileName = './typescript-graph.md';
await $`tsg --md "${fileName}"`;

markdown('hoge', fileName);
