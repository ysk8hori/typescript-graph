import path from 'path';
import { pipe } from 'remeda';
import { setupConfig, getConfig } from './config';
import { abstraction } from './graph/abstraction';
import { createGraph } from './graph/createGraph';
import { filterGraph } from './graph/filterGraph';
import { highlight } from './graph/highlight';
import {
  CodeMetrics,
  calculateCodeMetrics,
} from './metrics/calculateCodeMetrics';
import { measureInstability, OptionValues } from './models';
import { writeMarkdownFile } from './writeMarkdownFile';

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

  let metrics: CodeMetrics[] = [];
  if (commandOptions.metrics) {
    console.time('calculateCodeMetrics');
    metrics = calculateCodeMetrics(commandOptions);
    console.timeEnd('calculateCodeMetrics');
  }

  let couplingData: ReturnType<typeof measureInstability> = [];
  if (commandOptions.measureInstability) {
    console.time('coupling');
    couplingData = measureInstability(fullGraph);
    console.timeEnd('coupling');
  }

  const graph = pipe(
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
