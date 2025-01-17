import path from 'path';
import { setupConfig } from '../../setting/config';
import { createGraph } from '../../feature/graph/createGraph';
import { calculateCodeMetrics } from '../../feature/metric/calculateCodeMetrics';
import { Graph } from '../../feature/graph/models';
import { OptionValues } from '../../setting/model';
import { measureInstability } from '../../feature/graph/instability';
import { CodeMetrics } from '../../feature/metric/metricsModels';
import { resolveTsconfig } from '../../utils/tsc-util';
import ProjectTraverser from '../../feature/util/ProjectTraverser';
import { GraphAnalyzer } from '../../feature/graph/GraphAnalyzer';
import { mergeGraph } from '../../feature/graph/utils';
import { createCyclomaticComplexityAnalyzer } from '../../feature/metric/cyclomaticComplexity';
import { createSemanticSyntaxVolumeAnalyzer } from '../../feature/metric/semanticSyntaxVolume';
import { createCognitiveComplexityAnalyzer } from '../../feature/metric/cognitiveComplexity';
import { writeMarkdownFile } from './writeMarkdownFile';
import { bind_refineGraph } from '../../feature/graph/refineGraph';

export async function generateTsg(
  commandOptions: OptionValues & { executedScript: string },
) {
  setupConfig(
    path.join(
      path.resolve(commandOptions.dir ?? './'),
      commandOptions.configFile ?? '.tsgrc.json',
    ),
  );
  const refineGraph = bind_refineGraph(commandOptions);
  const tsconfig = resolveTsconfig(commandOptions);

  if (commandOptions.vue) {
    const { graph: fullGraph } = createGraph(commandOptions);
    const graph = refineGraph(fullGraph);
    const couplingData: ReturnType<typeof measureInstability> = getCouplingData(
      commandOptions,
      fullGraph,
    );
    const metrics: CodeMetrics[] = getCodeMetrics(commandOptions);
    await writeMarkdownFile(
      graph,
      {
        ...commandOptions,
        rootDir: tsconfig.options.rootDir,
      },
      couplingData,
      metrics,
    );
    return;
  }
  const traverser = new ProjectTraverser(tsconfig);
  console.time('traverse1');
  const reuslt = traverser.traverse(
    (...args) => new GraphAnalyzer(...args),
    // source => createCyclomaticComplexityAnalyzer(source.fileName),
    // source => createSemanticSyntaxVolumeAnalyzer(source.fileName),
    // source => createCognitiveComplexityAnalyzer(source.fileName),
  );
  console.timeEnd('traverse1');
  console.time('traverse2');
  const reuslt2 = traverser.traverse(
    (...args) => new GraphAnalyzer(...args),
    source => createCyclomaticComplexityAnalyzer(source.fileName),
    source => createSemanticSyntaxVolumeAnalyzer(source.fileName),
    source => createCognitiveComplexityAnalyzer(source.fileName),
  );
  console.timeEnd('traverse2');
  const fullGraph = mergeGraph(
    ...reuslt.map(([analyzer]) => analyzer.generateGraph()),
  );

  const graph = refineGraph(fullGraph);
  const metrics: CodeMetrics[] = getCodeMetrics(commandOptions);
  const couplingData: ReturnType<typeof measureInstability> = getCouplingData(
    commandOptions,
    fullGraph,
  );

  await writeMarkdownFile(
    graph,
    {
      ...commandOptions,
      rootDir: tsconfig.options.rootDir,
    },
    couplingData,
    metrics,
  );
}

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
