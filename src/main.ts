import path from 'path';
import { pipe } from 'remeda';
import { setupConfig, getConfig } from './config';
import { abstraction } from './feature/graph/abstraction';
import { createGraph } from './feature/graph/createGraph';
import { filterGraph } from './feature/graph/filterGraph';
import { highlight } from './feature/graph/highlight';
import {
  CodeMetrics,
  calculateCodeMetrics,
} from './feature/metric/calculateCodeMetrics';
import { Graph, measureInstability, OptionValues } from './models';
import { writeMarkdownFile } from './feature/markdown/writeMarkdownFile';

export async function main(
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
