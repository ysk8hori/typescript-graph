import type CognitiveComplexityAnalyzer from './CognitiveComplexityAnalyzer';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
export { CognitiveComplexityMetrics } from './CognitiveComplexityMetrics';

export function createCognitiveComplexityAnalyzer(
  ...params: ConstructorParameters<typeof CognitiveComplexityForSourceCode>
): CognitiveComplexityAnalyzer {
  return new CognitiveComplexityForSourceCode(...params);
}
