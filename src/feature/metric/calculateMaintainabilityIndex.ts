import { Tree } from '../../utils/Tree';
import { CognitiveComplexityMetrics } from './CognitiveComplexity';
import { CyclomaticComplexityMetrics } from './CyclomaticComplexity';
import { MetricsScope } from './metricsModels';
import { SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolume';

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
  const calculatedChildren = children?.map(c =>
    calculateMaintainabilityIndex(c),
  );
  // class や file の場合は子要素の平均値を取る
  const maintainabilityIndex =
    // (scope === 'class' || scope === 'file') && calculatedChildren
    //   ? calculatedChildren
    //       .map(c => c.maintainabilityIndex)
    //       .reduce((a, b) => a + b, 0) / calculatedChildren.length
    //   :
    Math.max(
      0,
      ((171 -
        5.2 * Math.log(semanticSyntaxVolume.score.volume) -
        0.115 * cyclomaticComplexity.score -
        0.115 * cognitiveComplexity.score -
        16.2 * Math.log(semanticSyntaxVolume.score.lines)) *
        100) /
        171,
    );
  return {
    filePath,
    name,
    scope,
    semanticSyntaxVolume,
    cognitiveComplexity,
    cyclomaticComplexity,
    maintainabilityIndex,
    children: calculatedChildren,
  };
}
