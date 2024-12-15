import { test, expect, describe } from 'vitest';
import { analyzeOperatorsAndOperands } from './analyzeOperatorsAndOperands';
import { logAstNodes } from './tsc-demo-util';

test.each([
  [
    'const x = 10;',
    {
      operandsTotal: 2,
      operandsUnique: 2,
      operatorsTotal: 1,
      operatorsUnique: 1,
    },
  ],
  [
    'let x = 10;let y = x = 20;',
    {
      operandsTotal: 5,
      operandsUnique: 4,
      operatorsTotal: 3,
      operatorsUnique: 2, // FIXME: 本当は 1 としたいが、VariableDeclaration と FirstAssignment の `=` を同じ演算子としてカウントできない
    },
  ],

  [
    // 関数名も operand に含まれる
    'function add(x: number, y = 1) {return x + y;}',
    {
      operandsTotal: 6,
      operandsUnique: 4,
      operatorsTotal: 2, // FIXME: 本当は 3 としたいが、引数へのデフォルト値の代入を演算子としてカウントできていない
      operatorsUnique: 2,
    },
  ],
  [
    'let x = 10, y=1;if (x > 5) {x += 1;} else {x = 0;}',
    {
      operandsTotal: 10,
      operandsUnique: 6,
      operatorsTotal: 7,
      operatorsUnique: 6, // FIXME: 本当は 5 としたいが、VariableDeclaration と FirstAssignment の `=` を同じ演算子としてカウントできない
    },
  ],
  // ["import { test, expect, describe } from 'vitest';test();", 4],

  // [
  //   "import * as ts from 'typescript';export function analyzeOperatorsAndOperands(sourceCode: string): number {const sourceFile = ts.createSourceFile('sample.ts',sourceCode,ts.ScriptTarget.ESNext,);}",
  //   6,
  // ],
])('`%s`', (sourceCode, expected) => {
  // const sourceCode = 'let x = 10;if (x > 5) {x += 1;} else {x = 0;}';
  logAstNodes(sourceCode);
  const result = analyzeOperatorsAndOperands(sourceCode);
  expect(result).toEqual(expected);
});

// import * as ts from 'typescript';
// export function analyzeOperatorsAndOperands(sourceCode: string): number {
//   const sourceFile = ts.createSourceFile(
//     'sample.ts',
//     sourceCode,
//     ts.ScriptTarget.ESNext,
//   );
// }
