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
