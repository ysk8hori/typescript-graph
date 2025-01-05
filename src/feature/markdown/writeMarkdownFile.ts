import { createWriteStream } from 'fs';
import mermaidify from '../mermaid/mermaidify';
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

    writeExecutedScript(ws, options.executedScript);
    writeGraph(ws, graph, options);
    writeCouplingData(ws, couplingData);
    writeMetrics(ws, metrics);

    ws.end();

    console.log(filename);
  });
}

export function writeExecutedScript(
  ws: { write: (str: string) => void },
  executedScript: string | undefined,
) {
  if (executedScript) {
    ws.write('```bash\n');
    ws.write(`${executedScript}\n`);
    ws.write('```\n');
  }
  ws.write('\n');
}

export function writeGraph(
  ws: { write: (str: string) => void },
  graph: Graph,
  options: Options,
) {
  ws.write('```mermaid\n');
  mermaidify(str => ws.write(str), graph, options);
  ws.write('```\n');
  ws.write('\n');
}

export function writeCouplingData(
  ws: { write: (str: string) => void },
  couplingData: ReturnType<typeof measureInstability>,
) {
  if (couplingData.length === 0) return;
  ws.write('## Instability\n');
  ws.write('\n');
  ws.write(
    'module name | Afferent<br>coupling | Efferent<br>coupling | Instability\n',
  );
  ws.write('--|--|--|--\n');

  couplingData.forEach(node => {
    ws.write(
      `${node.path} | ${node.afferentCoupling} | ${node.efferentCoupling} | ${node.instability.toFixed(2)}\n`,
    );
  });
  ws.write('\n');
}

export function writeMetrics(
  ws: { write: (str: string) => void },
  metrics: CodeMetrics[],
) {
  if (metrics.length === 0) return;
  sortMetrics(metrics);
  const flatten = flatMetrics(metrics);
  ws.write('## Code Metrics\n');
  ws.write('\n');

  writeMetricsTable(ws, flatten);
  writeMetricsCsv(ws, flatten);
  writeMetricsTsv(ws, flatten);
}

function writeMetricsTable(
  ws: { write: (str: string) => void },
  flatten: FlattenMaterics[],
) {
  ws.write('<table>\n');
  ws.write(
    `<thead><tr><th scope="col">file</th><th scope="col">scope</th><th scope="col">name</th>${flatten[0].scores.map(({ name }) => `<th scope="col">${name}</th>`).join('')}</tr></thead>\n`,
  );
  ws.write(`<tbody>\n`);
  flatten.forEach(m => {
    ws.write(
      `<tr><th scope="row">${m.fileName}</th><th scope="row">${m.scope}</th><th scope="row">${m.name}</th>${m.scores
        .map(({ value, state }) => ({
          score: Math.round(value * 100) / 100,
          state,
        }))
        .map(v => `<td>${getIconByState(v.state)} ${v.score}</td>`)
        .join('')}</tr>\n`,
    );
  });
  ws.write('</tbody></table>');
  ws.write('\n');
}

function writeMetricsCsv(
  ws: { write: (str: string) => void },
  flatten: FlattenMaterics[],
) {
  ws.write('<details>\n');
  ws.write('<summary>CSV</summary>\n');
  ws.write('\n');
  ws.write('```csv\n');
  ws.write(
    `file,scope,name,${flatten[0].scores.map(({ name }) => name).join(',')}\n`,
  );
  flatten.forEach(m => {
    ws.write(
      `${m.fileName},${m.scope},${m.name},${m.scores.map(({ value }) => value).join(',')}\n`,
    );
  });
  ws.write('```\n');
  ws.write('\n');
  ws.write('</details>\n');
  ws.write('\n');
}

function writeMetricsTsv(
  ws: { write: (str: string) => void },
  flatten: FlattenMaterics[],
) {
  ws.write('<details>\n');
  ws.write('<summary>TSV</summary>\n');
  ws.write('\n');
  ws.write('```tsv\n');
  ws.write(
    `file\tscope\tname\t${flatten[0].scores.map(({ name }) => name).join('\t')}\n`,
  );
  flatten.forEach(m => {
    ws.write(
      `${m.fileName}\t${m.scope}\t${m.name}\t${m.scores.map(({ value }) => value).join('\t')}\n`,
    );
  });
  ws.write('```\n');
  ws.write('\n');
  ws.write('</details>\n');
  ws.write('\n');
}
