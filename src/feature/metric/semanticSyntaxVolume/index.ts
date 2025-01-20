import type SemanticSyntaxVolumeAnalyzer from './SemanticSyntaxVolumeAnalyzer';
import SemanticSyntaxVolumeForSourceCode from './SemanticSyntaxVolumeForSourceCode';
export { SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolumeAnalyzer';

export function createSemanticSyntaxVolumeAnalyzer(
  ...params: ConstructorParameters<typeof SemanticSyntaxVolumeForSourceCode>
): SemanticSyntaxVolumeAnalyzer {
  return new SemanticSyntaxVolumeForSourceCode(...params);
}
