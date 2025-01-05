import { createWriteStream } from 'fs';
import { mermaidify } from '../mermaid/mermaidify';
import { Graph, measureInstability } from '../graph/models';
import {
  CodeMetrics,
  flatMetrics,
  FlattenMaterics,
  sortMetrics,
} from '../metric/calculateCodeMetrics';
import { getIconByState } from '../metric/metricsModels';
import { OptionValues } from '../../setting/model';

type Options = OptionValues & {
  rootDir: string;
  executedScript?: string;
};

export function writeMarkdownFile(
  markdownTitle: string,
  graph: Graph,
  options: Options,
  couplingData: ReturnType<typeof measureInstability>,
  metrics: CodeMetrics[],
) {
  return new Promise((resolve, reject) => {
    const filename = markdownTitle.endsWith('.md')
      ? markdownTitle
      : `./${markdownTitle}.md`;
    const ws = createWriteStream(filename);
    ws.on('finish', resolve);
    ws.on('error', reject);

    ws.write('# TypeScript Graph\n');
    ws.write('\n');

    writeExecutedScript(ws.write.bind(ws), options.executedScript);
    writeGraph(ws.write.bind(ws), graph, options);
    writeCouplingData(ws.write.bind(ws), couplingData);
    writeMetrics(ws.write.bind(ws), metrics);

    ws.end();

    console.log(filename);
  });
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

export function writeGraph(
  write: (str: string) => void,
  graph: Graph,
  options: Options,
) {
  write('```mermaid\n');
  mermaidify(str => write(str), graph, options);
  write('```\n');
  write('\n');
}

export function writeCouplingData(
  write: (str: string) => void,
  couplingData: ReturnType<typeof measureInstability>,
) {
  if (couplingData.length === 0) return;
  write('## Instability\n');
  write('\n');
  write(
    'module name | Afferent<br>coupling | Efferent<br>coupling | Instability\n',
  );
  write('--|--|--|--\n');

  couplingData.forEach(node => {
    write(
      `${node.path} | ${node.afferentCoupling} | ${node.efferentCoupling} | ${node.instability.toFixed(2)}\n`,
    );
  });
  write('\n');
}

export function writeMetrics(
  write: (str: string) => void,
  metrics: CodeMetrics[],
) {
  if (metrics.length === 0) return;
  sortMetrics(metrics);
  const flatten = flatMetrics(metrics);
  write('## Code Metrics\n');
  write('\n');

  writeMetricsTable(write, flatten);
  writeMetricsCsv(write, flatten);
  writeMetricsTsv(write, flatten);
}

function writeMetricsTable(
  write: (str: string) => void,
  flatten: FlattenMaterics[],
) {
  write('<table>\n');
  write(
    `<thead><tr><th scope="col">file</th><th scope="col">scope</th><th scope="col">name</th>${flatten[0].scores.map(({ name }) => `<th scope="col">${name}</th>`).join('')}</tr></thead>\n`,
  );
  write(`<tbody>\n`);
  flatten.forEach(m => {
    write(
      `<tr><th scope="row">${m.fileName}</th><th scope="row">${m.scope}</th><th scope="row">${m.name}</th>${m.scores
        .map(({ value, state }) => ({
          score: Math.round(value * 100) / 100,
          state,
        }))
        .map(v => `<td>${getIconByState(v.state)} ${v.score}</td>`)
        .join('')}</tr>\n`,
    );
  });
  write('</tbody></table>');
  write('\n');
}

function writeMetricsCsv(
  write: (str: string) => void,
  flatten: FlattenMaterics[],
) {
  write('<details>\n');
  write('<summary>CSV</summary>\n');
  write('\n');
  write('```csv\n');
  write(
    `file,scope,name,${flatten[0].scores.map(({ name }) => name).join(',')}\n`,
  );
  flatten.forEach(m => {
    write(
      `${m.fileName},${m.scope},${m.name},${m.scores.map(({ value }) => value).join(',')}\n`,
    );
  });
  write('```\n');
  write('\n');
  write('</details>\n');
  write('\n');
}

function writeMetricsTsv(
  write: (str: string) => void,
  flatten: FlattenMaterics[],
) {
  write('<details>\n');
  write('<summary>TSV</summary>\n');
  write('\n');
  write('```tsv\n');
  write(
    `file\tscope\tname\t${flatten[0].scores.map(({ name }) => name).join('\t')}\n`,
  );
  flatten.forEach(m => {
    write(
      `${m.fileName}\t${m.scope}\t${m.name}\t${m.scores.map(({ value }) => value).join('\t')}\n`,
    );
  });
  write('```\n');
  write('\n');
  write('</details>\n');
  write('\n');
}
