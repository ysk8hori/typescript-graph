import path from 'path';
import { setupConfig } from '../../setting/config';
import { createGraph } from '../../feature/graph/createGraph';
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
import { allPass, anyPass, isNot } from 'remeda';
import {
  convertRawToCodeMetrics,
  RawMetrics,
} from '../../feature/metric/functions/convertRawToCodeMetrics';

/** word に該当するか */
const bindMatchFunc = (word: string) => (filePath: string) =>
  filePath.toLowerCase().includes(word.toLowerCase());
/** word に完全一致するか */
const bindExactMatchFunc = (word: string) => (filePath: string) =>
  filePath === word;
/** 抽象的な判定関数 */
const judge = (filePath: string) => (f: (filePath: string) => boolean) =>
  f(filePath);

const isMatchSome = (words: string[]) => (filePath: string) =>
  words.map(bindMatchFunc).some(judge(filePath));
const isExactMatchSome = (words: string[]) => (filePath: string) =>
  words.map(bindExactMatchFunc).some(judge(filePath));

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
    await writeMarkdownFile(
      graph,
      {
        ...commandOptions,
        rootDir: tsconfig.options.rootDir,
      },
      couplingData,
      [],
    );
    return;
  }

  const isExactMatchSomeIncludes = isExactMatchSome(
    commandOptions.include ?? [],
  );
  const isMatchSomeIncludes = isMatchSome(commandOptions.include ?? ['']);
  const isNotMatchSomeExcludes = isNot(
    isMatchSome(commandOptions.exclude ?? []),
  );

  const traverser = new ProjectTraverser(tsconfig);

  const result4graph = traverser.traverse(
    anyPass([isExactMatchSomeIncludes, isNotMatchSomeExcludes]),
    (...args) => new GraphAnalyzer(...args),
  );
  const fullGraph = mergeGraph(
    ...result4graph.map(([analyzer]) => analyzer.generateGraph()),
  );

  const graph = refineGraph(fullGraph);
  const metrics: CodeMetrics[] = getCodeMetrics(
    commandOptions,
    traverser,
    allPass([isMatchSomeIncludes, isNotMatchSomeExcludes]),
  );
  // coupling を計測するには全てのノードが必要
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

function getCodeMetrics(
  commandOptions: OptionValues,
  traverser: ProjectTraverser,
  filter: (source: string) => boolean,
): CodeMetrics[] {
  if (!commandOptions.metrics) return [];
  return traverser
    .traverse(
      filter,
      source => createCyclomaticComplexityAnalyzer(source.fileName),
      source => createSemanticSyntaxVolumeAnalyzer(source.fileName),
      source => createCognitiveComplexityAnalyzer(source.fileName),
    )
    .map(
      ([cyca, ssva, coca]) =>
        ({
          cyclomaticComplexity: cyca.metrics,
          semanticSyntaxVolume: ssva.metrics,
          cognitiveComplexity: coca.metrics,
        }) satisfies RawMetrics,
    )
    .map(convertRawToCodeMetrics);
}
