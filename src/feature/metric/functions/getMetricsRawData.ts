import { readFileSync } from 'fs';
import ts from 'typescript';
import AstTraverser from '../AstTraverser';
import { createCyclomaticComplexityAnalyzer } from '../cyclomaticComplexity';
import { createCognitiveComplexityAnalyzer } from '../cognitiveComplexity';
import { createSemanticSyntaxVolumeAnalyzer } from '../semanticSyntaxVolume';

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
  const cyclomaticComplexity = createCyclomaticComplexityAnalyzer(path);
  const semanticSyntaxVolume = createSemanticSyntaxVolumeAnalyzer(path);
  const cognitiveComplexityAnalyzer = createCognitiveComplexityAnalyzer(path);
  const astTraverser = new AstTraverser(source, [
    semanticSyntaxVolume,
    cyclomaticComplexity,
    cognitiveComplexityAnalyzer,
  ]);
  astTraverser.traverse();
  return {
    semanticSyntaxVolume: semanticSyntaxVolume.metrics,
    cyclomaticComplexity: cyclomaticComplexity.metrics,
    cognitiveComplexity: cognitiveComplexityAnalyzer.metrics,
  };
}
