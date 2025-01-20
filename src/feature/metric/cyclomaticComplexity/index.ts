import type CyclomaticComplexityAnalyzer from './CyclomaticComplexityAnalyzer';
import CyclomaticComplexityForSourceCode from './CyclomaticComplexityForSourceCode';
export { CyclomaticComplexityMetrics } from './CyclomaticComplexityMetrics';

export function createCyclomaticComplexityAnalyzer(
  ...params: ConstructorParameters<typeof CyclomaticComplexityForSourceCode>
): CyclomaticComplexityAnalyzer {
  return new CyclomaticComplexityForSourceCode(...params);
}
