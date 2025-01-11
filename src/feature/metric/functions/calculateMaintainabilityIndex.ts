import { Tree } from '../../../utils/Tree';
import { CognitiveComplexityMetrics } from '../cognitiveComplexity';
import { CyclomaticComplexityMetrics } from '../cyclomaticComplexity';
import { MetricsScope } from '../metricsModels';
import { SemanticSyntaxVolumeMetrics } from '../SemanticSyntaxVolume';

interface RawMetrics {
  semanticSyntaxVolume: SemanticSyntaxVolumeMetrics;
  cyclomaticComplexity: CyclomaticComplexityMetrics;
  cognitiveComplexity: CognitiveComplexityMetrics;
  scope: MetricsScope;
  name: string;
  filePath: string;
}

export interface RawMetricsWithMaintainabilityIndex extends RawMetrics {
  maintainabilityIndex: number;
}

export function calculateMaintainabilityIndex({
  filePath,
  name,
  scope,
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
  children,
}: Tree<RawMetrics>): Tree<RawMetricsWithMaintainabilityIndex> {
  const isClassOrFile = (scope === 'class' || scope === 'file') && children;
  const divisor = isClassOrFile ? 2 : 1;
  const semanticSyntaxVolumeScore = semanticSyntaxVolume.score.volume / divisor;
  const cyclomaticComplexityScore = cyclomaticComplexity.score / divisor;
  const cognitiveComplexityScore = cognitiveComplexity.score / divisor;
  const linesScore = semanticSyntaxVolume.score.lines / divisor;
  const MAGIC_NUMBER = 171;
  const maintainabilityIndex = Math.min(
    100,
    Math.max(
      0,
      ((MAGIC_NUMBER -
        5.2 * Math.log(semanticSyntaxVolumeScore) -
        0.115 * cyclomaticComplexityScore -
        0.115 * cognitiveComplexityScore -
        16.2 * Math.log(linesScore)) *
        100) /
        MAGIC_NUMBER,
    ),
  );
  return {
    filePath,
    name,
    scope,
    semanticSyntaxVolume,
    cognitiveComplexity,
    cyclomaticComplexity,
    maintainabilityIndex,
    children: children?.map(calculateMaintainabilityIndex),
  };
}
