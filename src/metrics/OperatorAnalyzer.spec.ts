import { test, expect, describe } from 'vitest';
import { logAstNodes } from './tsc-demo-util';
import OperatorAnalyzer from './OperatorAnalyzer';
import ts from 'typescript';

test.each([
  ['const x = 10;', { operatorsTotal: 1, operatorsUnique: 1 }],
  [
    'let x = 10;let y = x = 20;',
    {
      operatorsTotal: 3,
      operatorsUnique: 2, // FIXME: 本当は 1 としたいが、VariableDeclaration と FirstAssignment の `=` を同じ演算子としてカウントできない
    },
  ],

  [
    'function add(x: number, y = 1) {return x + y;}',
    {
      operatorsTotal: 2, // FIXME: 本当は 3 としたいが、引数へのデフォルト値の代入を演算子としてカウントできていない
      operatorsUnique: 2,
    },
  ],
  [
    'let x = 10, y=1;if (x > 5) {x += 1;} else {x = 0;}',
    {
      operatorsTotal: 7,
      operatorsUnique: 6, // FIXME: 本当は 5 としたいが、VariableDeclaration と FirstAssignment の `=` を同じ演算子としてカウントできない
    },
  ],
])('`%s`', (sourceCode, expected) => {
  logAstNodes(sourceCode);
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  const analyzer = new OperatorAnalyzer(sourceFile);
  expect(analyzer.analyze()).toEqual(expected);
});
