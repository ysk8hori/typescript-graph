import {
  flatMetrics,
  FlattenMaterics,
  sortMetrics,
} from './calculateCodeMetrics';
import { CodeMetrics } from './convertRawToCodeMetrics';
import { getIconByState } from './metricsModels';

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
      `<tr><th scope="row">${m.filePath}</th><th scope="row">${m.scope}</th><th scope="row">${m.name}</th>${m.scores
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
      `${m.filePath},${m.scope},${m.name},${m.scores.map(({ value }) => value).join(',')}\n`,
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
      `${m.filePath}\t${m.scope}\t${m.name}\t${m.scores.map(({ value }) => value).join('\t')}\n`,
    );
  });
  write('```\n');
  write('\n');
  write('</details>\n');
  write('\n');
}
