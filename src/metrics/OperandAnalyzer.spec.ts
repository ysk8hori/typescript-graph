import { test, expect, describe } from 'vitest';
import OperandAnalyzer from './OperandAnalyzer';
import { logAstNodes } from './tsc-demo-util';
import ts from 'typescript';

test.each([
  [
    'const x = 10;',
    {
      operandsTotal: 2,
      operandsUnique: 2,
    },
  ],
  [
    'let x = 10;let y = x = 20;',
    {
      operandsTotal: 5,
      operandsUnique: 4,
    },
  ],

  [
    // 関数名も operand に含まれる
    'function add(x: number, y = 1) {return x + y;}',
    {
      operandsTotal: 6,
      operandsUnique: 4,
    },
  ],
  [
    'let x = 10, y=1;if (x > 5) {x += 1;} else {x = 0;}',
    {
      operandsTotal: 10,
      operandsUnique: 6,
    },
  ],
  // ["import { test, expect, describe } from 'vitest';test();", 4],

  // [
  //   6,
  // ],
])('`%s`', (sourceCode, expected) => {
  logAstNodes(sourceCode);
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  const analyzer = new OperandAnalyzer(sourceFile);
  expect(analyzer.analyze()).toEqual(expected);
});
