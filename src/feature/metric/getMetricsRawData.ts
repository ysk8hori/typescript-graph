import { readFileSync } from 'fs';
import ts from 'typescript';
import AstTraverser from './AstTraverser';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
import CyclomaticComplexityForSourceCode from './CyclomaticComplexityForSourceCode';
import SemanticSyntaxVolumeForSourceCode from './SemanticSyntaxVolumeForSourceCode';

export function getMetricsRawData(path: string) {
  const sourceCode = readFileSync(path, 'utf-8');
  const source = ts.createSourceFile(
    path,
    sourceCode,
    ts.ScriptTarget.ESNext,
    // parent を使うことがあるので true
    true,
    ts.ScriptKind.TS,
  );
  const cyclomaticComplexity = new CyclomaticComplexityForSourceCode(path);
  const semanticSyntaxVolume = new SemanticSyntaxVolumeForSourceCode(path);
  const cognitiveComplexity = new CognitiveComplexityForSourceCode(path);
  const astTraverser = new AstTraverser(source, [
    semanticSyntaxVolume,
    cyclomaticComplexity,
    cognitiveComplexity,
  ]);
  astTraverser.traverse();
  return {
    semanticSyntaxVolume: semanticSyntaxVolume.metrics,
    cyclomaticComplexity: cyclomaticComplexity.metrics,
    cognitiveComplexity: cognitiveComplexity.metrics,
  };
}
