import CognitiveComplexityAnalyzer from './cognitiveComplexity/CognitiveComplexityAnalyzer';
import CognitiveComplexityForSourceCode from './cognitiveComplexity/CognitiveComplexityForSourceCode';
export { CognitiveComplexityMetrics } from './cognitiveComplexity/CognitiveComplexityMetrics';

export function createCognitiveComplexityAnalyzer(
  ...params: ConstructorParameters<typeof CognitiveComplexityForSourceCode>
): CognitiveComplexityAnalyzer {
  return new CognitiveComplexityForSourceCode(...params);
}
