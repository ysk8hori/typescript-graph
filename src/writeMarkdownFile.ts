import { createWriteStream } from 'fs';
import mermaidify from './mermaidify';
import { Graph, OptionValues, measureInstability } from './models';
import { CodeMetrics } from './metrics/calculateCodeMetrics';

type Options = OptionValues & {
  rootDir: string;
  executedScript?: string;
};

export async function writeMarkdownFile(
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
    if (options.executedScript) {
      ws.write('```bash\n');
      ws.write(`${options.executedScript}\n`);
      ws.write('```\n');
    }
    ws.write('\n');
    ws.write('```mermaid\n');
    mermaidify(str => ws.write(str), graph, options);
    ws.write('```\n');

    if (couplingData.length !== 0) {
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
      ws.write('\n');
    }

    if (metrics.length !== 0) {
      const flatten = metrics
        .toSorted((m, n) => m.scores[0].value - n.scores[0].value)
        .map(m => flatMetrics(m))
        .flat();
      ws.write('## Code Metrics\n');

      ws.write('\n');
      ws.write('<table>\n');
      ws.write(
        `<thead><tr><th scope="col">file</th><th scope="col">function, class, etc</th>${flatten[0].scores.map(({ name }) => `<th scope="col">${name}</th>`).join('')}</tr></thead>\n`,
      );
      ws.write(`<tbody>\n`);
      flatten.forEach(m => {
        ws.write(
          `<tr><th scope="row">${m.fileName}</th><th scope="row">${m.name}</th>${m.scores
            .map(({ value }) => Math.round(value * 100) / 100)
            .map(v => `<td>${v}</td>`)
            .join('')}</tr>\n`,
        );
      });
      ws.write('</tbody></table>');

      ws.write('\n');
      ws.write('<details>\n');
      ws.write('<summary>CSV</summary>\n');
      ws.write('\n');
      ws.write('```csv\n');
      ws.write(
        `file,"function, class, etc",${flatten[0].scores.map(({ name }) => name).join(',')}\n`,
      );
      flatten.forEach(m => {
        ws.write(
          `${m.fileName},${m.name},${m.scores.map(({ value }) => value).join(',')}\n`,
        );
      });
      ws.write('```\n');
      ws.write('\n');
      ws.write('</details>\n');

      ws.write('\n');
      ws.write('<details>\n');
      ws.write('<summary>TSV</summary>\n');
      ws.write('\n');
      ws.write('```tsv\n');
      ws.write(
        `file\t"function, class, etc",${flatten[0].scores.map(({ name }) => name).join('\t')}\n`,
      );
      flatten.forEach(m => {
        ws.write(
          `${m.fileName}\t${m.name}\t${m.scores.map(({ value }) => value).join('\t')}\n`,
        );
      });
      ws.write('```\n');
      ws.write('\n');
      ws.write('</details>\n');
    }
    ws.end();

    console.log(filename);
  });
}

function flatMetrics(
  metrics: CodeMetrics,
  fileName?: string,
): ({ fileName: string } & Pick<CodeMetrics, 'name' | 'scores'>)[] {
  const children =
    metrics.children?.map(c =>
      fileName
        ? flatMetrics({ ...c, name: `${metrics.name}.${c.name}` }, fileName) // クラスを想定。汎用的でない処理なので注意。
        : flatMetrics(c, metrics.name),
    ) ?? [];
  return [
    {
      fileName: fileName ?? metrics.name,
      name: fileName ? metrics.name : '-',
      scores: metrics.scores,
    },
    ...children,
  ].flat();
}
