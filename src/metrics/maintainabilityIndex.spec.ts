import { test } from 'vitest';
import * as ts from 'typescript';
import AstTraverser from './AstTraverser';
import SemanticSyntaxVolume from './SemanticSyntaxVolume';
import { readFileSync } from 'fs';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
import { CognitiveComplexityMetrics } from './CognitiveComplexity';
import CyclomaticComplexityForSourceCode from './CyclomaticComplexityForSourceCode';

test.each([
  'src/graph/createGraph.ts',
  'src/graph/highlight.ts',
  'src/metrics/CyclomaticComplexity.ts',
  'src/metrics/CognitiveComplexity.ts',
  'src/metrics/SemanticSyntaxVolume.ts',
  'src/metrics/Metrics.ts',
  'src/metrics/AstTraverser.ts',
  'src/mermaidify.ts',
  'src/models.ts',
  'src/writeMarkdownFile.ts',
  'src/config/index.ts',
  'src/graph/utils.ts',
  '../numberplace-generator/functions/createGame.ts',
])('%s', path => {
  console.log('\n🐥', path);
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
  const volume = new SemanticSyntaxVolume();
  const cognitiveComplexity = new CognitiveComplexityForSourceCode(path);
  const astTraverser = new AstTraverser(source, [
    volume,
    cyclomaticComplexity,
    cognitiveComplexity,
  ]);
  astTraverser.traverse();
  console.log('Cognitive Complexity ▼');
  logCognitiveComplexityMetrics(cognitiveComplexity.metrics);
  console.log('Cyclomatic Complexity ▼');
  logCognitiveComplexityMetrics(cyclomaticComplexity.metrics);
  console.log('Semantic Syntax Volume ▼');
  console.table(volume.metrics);
  const halsteadVolume = volume.volume;
  const maintainabilityIndex = Math.max(
    0,
    ((171 -
      5.2 * Math.log(halsteadVolume) -
      0.23 * cyclomaticComplexity.metrics.score -
      16.2 * Math.log(source.getLineAndCharacterOfPosition(source.end).line)) *
      100) /
      171,
  );
  console.log('Maintainability Index:', maintainabilityIndex);
});

function logCognitiveComplexityMetrics(metrics: CognitiveComplexityMetrics) {
  console.group(metrics.name, metrics.score);
  metrics.children?.forEach(child => logCognitiveComplexityMetrics(child));
  console.groupEnd();
}
