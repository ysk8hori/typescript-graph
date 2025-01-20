import { createWriteStream } from 'fs';
import type {
  measureInstability} from '../../feature/graph/instability';
import {
  writeCouplingData,
} from '../../feature/graph/instability';
import type { Graph } from '../../feature/graph/models';
import { writeGraph } from '../../feature/mermaid/mermaidify';
import type { CodeMetrics } from '../../feature/metric/metricsModels';
import type { OptionValues } from '../../setting/model';
import { writeMetrics } from './writeMetricsTable';

type Options = OptionValues & {
  rootDir: string;
  executedScript?: string;
};

export function writeMarkdownFile(
  graph: Graph,
  options: Options,
  couplingData: ReturnType<typeof measureInstability>,
  metrics: CodeMetrics[],
) {
  const markdownTitle = options.md ?? 'typescript-graph';
  return new Promise((resolve, reject) => {
    const filename = markdownTitle.endsWith('.md')
      ? markdownTitle
      : `./${markdownTitle}.md`;
    const ws = createWriteStream(filename);
    ws.on('finish', resolve);
    ws.on('error', reject);

    const write = (str: string) => ws.write(str);
    writeTitle(write);
    writeExecutedScript(write, options.executedScript);
    writeGraph(write, graph, options);
    writeCouplingData(write, couplingData);
    writeMetrics(write, metrics);
    ws.end();

    console.log(filename);
  });
}

export function writeTitle(write: (str: string) => void) {
  write('# TypeScript Graph\n');
  write('\n');
}

export function writeExecutedScript(
  write: (str: string) => void,
  executedScript: string | undefined,
) {
  if (executedScript) {
    write('```bash\n');
    write(`${executedScript}\n`);
    write('```\n');
  }
  write('\n');
}
