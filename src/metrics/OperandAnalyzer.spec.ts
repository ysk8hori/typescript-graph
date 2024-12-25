import { test, expect, describe } from 'vitest';
import OperandAnalyzer from './OperandAnalyzer';
import { logAstNodes } from './tsc-demo-util';
import ts from 'typescript';

function createSourceFile(sourceCode: string) {
  return ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

test.each([
  [
    '代入と連鎖代入',
    'let x = 10;let y = x = 20;',
    {
      operandsTotal: 5,
      operandsUnique: 4,
    },
  ],
  [
    '関数名も operand に含む',
    'function add(x: number, y = 1) {return x + y;}',
    {
      operandsTotal: 6,
      operandsUnique: 4,
    },
  ],
  [
    '変数宣言リスト',
    'let x=10,y=1;if(x>5){x+=1;}else{x=0;}',
    {
      operandsTotal: 10,
      operandsUnique: 6,
    },
  ],
  [
    'import 対象のモジュールとインポート元のパスもカウントする',
    "import { test, expect, describe } from 'vitest';test();",
    {
      operandsTotal: 5,
      operandsUnique: 4,
    },
  ],
  [
    '型名と型定義におけるプロパティ名もカウントする',
    `\
interface Swordsman {
  sword: string;
}
interface Wizard {
  magic: string;
}
type MagicalSwordsman = Swordsman & Wizard;
    `,
    {
      operandsTotal: 7,
      operandsUnique: 5,
    },
  ],
])('%s', (_, sourceCode, expected) => {
  logAstNodes(sourceCode);
  const analyzer = new OperandAnalyzer(createSourceFile(sourceCode));
  expect(analyzer.analyze()).toEqual(expected);
});
