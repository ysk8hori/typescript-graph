import path from 'path';
import { allPass, anyPass, isNot, map, pipe } from 'remeda';
import { setupConfig } from '../../setting/config';
import type { Graph } from '../../feature/graph/models';
import type { OptionValues } from '../../setting/model';
import { measureInstability } from '../../feature/graph/instability';
import type { CodeMetrics } from '../../feature/metric/metricsModels';
import { resolveTsconfig } from '../../utils/tsc-util';
import ProjectTraverser from '../../feature/util/ProjectTraverser';
import { GraphAnalyzer } from '../../feature/graph/GraphAnalyzer';
import { mergeGraph } from '../../feature/graph/utils';
import { bind_refineGraph } from '../../feature/graph/refineGraph';
import { calculateCodeMetrics } from '../../feature/metric/calculateCodeMetrics';
import { setupVueEnvironment } from '../../utils/vue-util';
import { writeMarkdownFile } from './writeMarkdownFile';
import { writeForAiData } from './writeForAiData';

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
  const [tsconfig, renameGraph] = commandOptions.vue
    ? setupVueEnvironment(commandOptions)
    : [resolveTsconfig(commandOptions)];

  const isExactMatchSomeIncludes = isExactMatchSome(
    commandOptions.include ?? [],
  );
  const isMatchSomeIncludes = isMatchSome(commandOptions.include ?? ['']);
  const isNotMatchSomeExcludes = isNot(
    isMatchSome(commandOptions.exclude ?? []),
  );

  const traverser = new ProjectTraverser(tsconfig);

  const fullGraph = pipe(
    traverser.traverse(
      anyPass([isExactMatchSomeIncludes, isNotMatchSomeExcludes]),
      GraphAnalyzer.create,
    ),
    map(([analyzer]) => analyzer.generateGraph()),
    mergeGraph,
  );

  const graph = renameGraph
    ? renameGraph(refineGraph(fullGraph))
    : refineGraph(fullGraph);
  
  // Enable metrics automatically for --stdout option
  const effectiveOptions = commandOptions.stdout 
    ? { ...commandOptions, metrics: true }
    : commandOptions;
    
  const metrics: CodeMetrics[] = calculateCodeMetrics(
    effectiveOptions,
    traverser,
    allPass([isMatchSomeIncludes, isNotMatchSomeExcludes]),
  );
  // coupling を計測するには全てのノードが必要
  const couplingData: ReturnType<typeof measureInstability> = getCouplingData(
    commandOptions,
    fullGraph,
  );

  const options = {
    ...commandOptions,
    rootDir: tsconfig.options.rootDir,
  };

  // Output data based on format option
  if (commandOptions.stdout) {
    writeForAiData(graph, options, metrics);
  } else {
    // Default: write markdown file
    await writeMarkdownFile(graph, options, couplingData, metrics);
  }

  // Write markdown file when explicitly requested with --md option
  if (commandOptions.md && commandOptions.stdout) {
    await writeMarkdownFile(graph, options, couplingData, metrics);
  }
}

function getCouplingData(commandOptions: OptionValues, fullGraph: Graph) {
  let couplingData: ReturnType<typeof measureInstability> = [];
  if (commandOptions.measureInstability) {
    couplingData = measureInstability(fullGraph);
  }
  return couplingData;
}
