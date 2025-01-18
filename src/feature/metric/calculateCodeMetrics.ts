import { OptionValues } from '../../setting/model';
import {
  convertRawToCodeMetrics,
  RawMetrics,
} from './functions/convertRawToCodeMetrics';
import { CodeMetrics } from './metricsModels';
import ProjectTraverser from '../util/ProjectTraverser';
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
