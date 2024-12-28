import { test, expect, describe } from 'vitest';
import AstLogger from './AstLogger';
import * as ts from 'typescript';
import AstTraverser from './AstTraverser';
import CyclomaticComplexity from './CyclomaticComplexity';
import SemanticSyntaxVolume, {
  type SemanticSyntaxVolumeMetrics,
} from './SemanticSyntaxVolume';
import { readFileSync } from 'fs';

test.each([
  'src/graph/createGraph.ts',
  'src/graph/highlight.ts',
  'src/metrics/CyclomaticComplexity.ts',
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
  console.log('\n🐥 ', path);
  const sourceCode = readFileSync(path, 'utf-8');
  const source = ts.createSourceFile(
    'sample.tsx',
    sourceCode,
    ts.ScriptTarget.ESNext,
    // parent を使うことがあるので true
    true,
    ts.ScriptKind.TS,
  );
  const cyclomaticComplexity = new CyclomaticComplexity();
  const volume = new SemanticSyntaxVolume();
  const astTraverser = new AstTraverser(source, [volume, cyclomaticComplexity]);
  astTraverser.traverse();
  console.log('Cyclomatic Complexity:', cyclomaticComplexity.metrics);
  console.log('Semantic Syntax Volume:', volume.volume);
  console.table(volume.metrics);
  // Maintainability Index = MAX(0,(171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code))*100 / 171)
  const halsteadVolume = volume.volume;
  const maintainabilityIndex = Math.max(
    0,
    ((171 -
      5.2 * Math.log(halsteadVolume) -
      0.23 * cyclomaticComplexity.metrics -
      16.2 * Math.log(source.getLineAndCharacterOfPosition(source.end).line)) *
      100) /
      171,
  );
  console.log('Maintainability Index:', maintainabilityIndex);
});
