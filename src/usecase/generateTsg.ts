import path from 'path';
import { pipe } from 'remeda';
import { setupConfig, getConfig } from '../setting/config';
import { abstraction } from '../feature/graph/abstraction';
import { createGraph } from '../feature/graph/createGraph';
import { filterGraph } from '../feature/graph/filterGraph';
import { highlight } from '../feature/graph/highlight';
import { calculateCodeMetrics } from '../feature/metric/calculateCodeMetrics';
import { Graph } from '../feature/graph/models';
import { writeMetrics } from '../feature/metric/writeMetricsTable';
import { OptionValues } from '../setting/model';
import { createWriteStream } from 'fs';
import { writeGraph } from '../feature/mermaid/mermaidify';
import {
  measureInstability,
  writeCouplingData,
} from '../feature/graph/instability';
import { CodeMetrics } from '../feature/metric/metricsModels';

export async function generateTsg(
  commandOptions: OptionValues & { executedScript: string },
) {
  setupConfig(
    path.join(
      path.resolve(commandOptions.dir ?? './'),
      commandOptions.configFile ?? '.tsgrc.json',
    ),
  );

  const { graph: fullGraph, meta } = createGraph(commandOptions);
  const graph = refineGraph(commandOptions, fullGraph);
  const metrics: CodeMetrics[] = getCodeMetrics(commandOptions);
  const couplingData: ReturnType<typeof measureInstability> = getCouplingData(
    commandOptions,
    fullGraph,
  );

  await writeMarkdownFile(
    commandOptions.md ?? 'typescript-graph',
    graph,
    {
      ...commandOptions,
      rootDir: meta.rootDir,
      executedScript: commandOptions.executedScript,
    },
    couplingData,
    metrics,
  );
}

const refineGraph = (commandOptions: OptionValues, fullGraph: Graph) =>
  pipe(
    fullGraph,
    graph =>
      filterGraph(
        commandOptions.include,
        [...(getConfig().exclude ?? []), ...(commandOptions.exclude ?? [])],
        graph,
      ),
    graph => abstraction(commandOptions.abstraction, graph),
    graph => highlight(commandOptions.highlight, graph),
  );

function getCouplingData(commandOptions: OptionValues, fullGraph: Graph) {
  let couplingData: ReturnType<typeof measureInstability> = [];
  if (commandOptions.measureInstability) {
    console.time('coupling');
    couplingData = measureInstability(fullGraph);
    console.timeEnd('coupling');
  }
  return couplingData;
}

function getCodeMetrics(commandOptions: OptionValues) {
  let metrics: CodeMetrics[] = [];
  if (commandOptions.metrics) {
    console.time('calculateCodeMetrics');
    metrics = calculateCodeMetrics(commandOptions);
    console.timeEnd('calculateCodeMetrics');
  }
  return metrics;
}

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
