import { danger, warn } from 'danger';
import typescriptGraph from 'danger-plugin-typescript-graph';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

typescriptGraph();
