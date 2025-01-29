import type { OptionValues } from '../../setting/model';
import type ProjectTraverser from '../util/ProjectTraverser';
import type { RawMetrics } from './functions/convertRawToCodeMetrics';
import { convertRawToCodeMetrics } from './functions/convertRawToCodeMetrics';
import type { CodeMetrics } from './metricsModels';
import { createCyclomaticComplexityAnalyzer } from './cyclomaticComplexity';
import { createSemanticSyntaxVolumeAnalyzer } from './semanticSyntaxVolume';
import { createCognitiveComplexityAnalyzer } from './cognitiveComplexity';

export function calculateCodeMetrics(
  commandOptions: Pick<OptionValues, 'metrics'>,
  traverser: ProjectTraverser,
  filter: (source: string) => boolean,
): CodeMetrics[] {
  if (!commandOptions.metrics) return [];
  return traverser
    .traverse(
      filter,
      source =>
        createCyclomaticComplexityAnalyzer(
          // TODO: getFilePath は至るところで使われるのでユーティリティ関数化するべき
          traverser.getFilePath(source.fileName),
        ),
      source =>
        createSemanticSyntaxVolumeAnalyzer(
          traverser.getFilePath(source.fileName),
        ),
      source =>
        createCognitiveComplexityAnalyzer(
          traverser.getFilePath(source.fileName),
        ),
    )
    .map(
      ([
        { metrics: cyclomaticComplexity },
        { metrics: semanticSyntaxVolume },
        { metrics: cognitiveComplexity },
      ]) =>
        ({
          cyclomaticComplexity,
          semanticSyntaxVolume,
          cognitiveComplexity,
        }) satisfies RawMetrics,
    )
    .map(convertRawToCodeMetrics);
}
