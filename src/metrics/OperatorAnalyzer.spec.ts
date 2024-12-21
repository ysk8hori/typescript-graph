import { test, expect, describe } from 'vitest';
import { logAstNodes } from './tsc-demo-util';
import OperatorAnalyzer from './OperatorAnalyzer';
import ts from 'typescript';

type OperatorTest = {
  perspective: string;
  tests: [string, { operatorsTotal: number; operatorsUnique: number }][];
};

describe.each([
  {
    perspective: '? の区別',
    tests: [['a?b:c?.d(e??f)', { operatorsTotal: 3, operatorsUnique: 3 }]],
  },
  {
    perspective: '加算 算術演算子 PlusToken',
    tests: [
      ['x + y', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['const x = x + y + z', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: '減算 算術演算子 MinusToken',
    tests: [
      ['x - y', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['const x = x - y - z', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: '乗算 算術演算子 AsteriskToken',
    tests: [
      ['x * y', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['const x = x * y * z', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: '除算 算術演算子 SlashToken',
    tests: [
      ['x / y', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['const x = x / y / z', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: '剰余 算術演算子 PercentToken',
    tests: [
      ['x % y', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['const x = x % y % z', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: 'オプショナルチェーン演算子 QuestionDotToken',
    tests: [['const x = x?.y?.z', { operatorsTotal: 3, operatorsUnique: 2 }]],
  },
  {
    perspective: 'new 演算子 NewExpression',
    tests: [
      ['const x = new X(new Y());', { operatorsTotal: 3, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: 'super キーワード SuperKeyword',
    tests: [
      [
        'class A extends B { a() {super.b()} }',
        { operatorsTotal: 1, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: 'import() 構文 ImportKeyword',
    tests: [
      ['const a = import("a");', { operatorsTotal: 2, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: 'import 文のカウント ImportDeclaration',
    tests: [
      ['import hoge from "hoge";', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['import "hoge";', { operatorsTotal: 1, operatorsUnique: 1 }],
      [
        'import hoge from "hoge";import "hoge";',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective:
      '前置型、後置方、インクリメント、デクリメント、それぞれの演算子 (Prefix|Postfix)UnaryExpression',
    tests: [
      ['a++;', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['a--;', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['++a;', { operatorsTotal: 1, operatorsUnique: 1 }],
      ['--a;', { operatorsTotal: 1, operatorsUnique: 1 }],
      [
        'a++;a--;++a;--a;b++;b--;++b;--b;',
        { operatorsTotal: 8, operatorsUnique: 4 },
      ],
    ],
  },
  {
    perspective: 'delete 演算子 DeleteExpression',
    tests: [
      [
        'delete Employee.firstname;delete Employee.lastname;',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: 'void 単項演算子 VoidExpression',
    tests: [
      [
        'void Employee.firstname;void Employee.lastname;',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: 'typeof 単項演算子 TypeOfExpression',
    tests: [
      [
        'typeof Employee.firstname;typeof Employee.lastname;',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: '単項正値演算子 単項負値演算子 PrefixUnaryExpression',
    tests: [
      ['+"";+true;-"";-true;', { operatorsTotal: 4, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: 'ビット否定 単項演算子 PrefixUnaryExpression',
    tests: [['~5;~-3', { operatorsTotal: 3, operatorsUnique: 2 }]],
  },
  {
    perspective: '論理否定 単項演算子 PrefixUnaryExpression',
    tests: [['!true;!false', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: 'await 単項演算子 AwaitExpression',
    tests: [
      ['await foo(); await bar;', { operatorsTotal: 2, operatorsUnique: 1 }],
    ],
  },
  {
    perspective: '小なり 関係演算子 FirstBinaryOperator',
    tests: [['3n < 5; 3n < 5', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: '小なりイコール 関係演算子 LessThanEqualsToken',
    tests: [['3n <= 5; 3n <= 5', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: '大なり 関係演算子 GreaterThanToken',
    tests: [['3n > 5; 3n > 5', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: '大なりイコール 関係演算子 GreaterThanEqualsToken',
    tests: [['3n >= 5; 3n >= 5', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: 'instanceof 関係演算子 InstanceOfKeyword',
    tests: [
      [
        'car instanceof Car; auto instanceof Car',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: 'in 関係演算子 InKeyword',
    tests: [
      [
        '"make" in car; "make" in car;',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: '等価 等値演算子 EqualsEqualsToken',
    tests: [
      ['"1" == 1; 0 == false;', { operatorsTotal: 2, operatorsUnique: 1 }],
    ],
  },
  {
    perspective: '不等価 等値演算子 ExclamationEqualsToken',
    tests: [
      ['"1" != 1; 0 != false;', { operatorsTotal: 2, operatorsUnique: 1 }],
    ],
  },
  {
    perspective: '厳密等価 等値演算子 EqualsEqualsEqualsToken',
    tests: [
      ['"1" === 1; 0 === false;', { operatorsTotal: 2, operatorsUnique: 1 }],
    ],
  },
  {
    perspective: '厳密不等価 等値演算子 ExclamationEqualsEqualsToken',
    tests: [
      ['"1" !== 1; 0 !== false;', { operatorsTotal: 2, operatorsUnique: 1 }],
    ],
  },
  {
    perspective: '左シフト ビットシフト演算子 LessThanLessThanToken',
    tests: [['a << 2; a << 2', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective:
      '符号維持右シフト ビットシフト演算子 GreaterThanGreaterThanToken',
    tests: [['a >> 2; a >> 2', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective:
      '符号なし右シフト ビットシフト演算子 GreaterThanGreaterThanGreaterThanToken',
    tests: [['a >>> 2; a >>> 2', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: 'ビット論理積 バイナリービット演算子 AmpersandToken',
    tests: [['3 & 5; a & b', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: 'ビット論理和 バイナリービット演算子 BarToken',
    tests: [['3 | 5; a | b', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: 'ビット排他的論理和xor バイナリービット演算子 CaretToken',
    tests: [['3 ^ 5; a ^ b', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    perspective: '論理積 バイナリー論理演算子 AmpersandAmpersandToken',
    tests: [
      [
        'true && true; true && false',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: '論理和 バイナリー論理演算子 BarBarToken',
    tests: [
      [
        'true || true; true || false',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: 'Null 合体演算子 バイナリー論理演算子 QuestionQuestionToken',
    tests: [
      [
        'true ?? true; true ?? false',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: '条件（三項）演算子 QuestionQuestionToken',
    tests: [
      [
        'true ? true:false; a ? 1 : 2',
        { operatorsTotal: 2, operatorsUnique: 1 },
      ],
    ],
  },
  {
    perspective: '代入演算子 FirstAssignment',
    tests: [['a=1;a=2;a==2;a===2;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '乗算代入 代入演算子 AsteriskEqualsToken',
    tests: [['a*=1;a*=2;a=3;a*3;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '除算代入 代入演算子 SlashEqualsToken',
    tests: [['a/=1;a/=2;a=3;a/3;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '剰余代入 代入演算子 PercentEqualsToken',
    tests: [['a%=1;a%=2;a=3;a%3;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '加算代入 代入演算子 FirstCompoundAssignment',
    tests: [['a+=1;a+=2;a=3;a+3;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '減算代入 代入演算子 MinusEqualsToken',
    tests: [['a-=1;a-=2;a=3;a-3;', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: '左シフト代入 代入演算子 LessThanLessThanEqualsToken',
    tests: [
      ['a<<=1;a<<=2;a=3;a<<4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: '右シフト代入 代入演算子 GreaterThanGreaterThanEqualsToken',
    tests: [
      ['a>>=1;a>>=2;a=3;a>>4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective:
      '符号なし右シフト代入 代入演算子 GreaterThanGreaterThanGreaterThanEqualsToken',
    tests: [
      ['a>>>=1;a>>>=2;a=3;a>>>4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: 'ビット論理積代入 代入演算子 AmpersandEqualsToken',
    tests: [['a&=1;a&=2;a=3;a&4', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: 'ビット排他的論理和代入 代入演算子 LastBinaryOperator',
    tests: [['a^=1;a^=2;a=3;a^4', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: 'ビット論理和代入 代入演算子 BarEqualsToken',
    tests: [['a|=1;a|=2;a=3;a|4', { operatorsTotal: 4, operatorsUnique: 3 }]],
  },
  {
    perspective: 'べき乗代入 代入演算子 AsteriskAsteriskEqualsToken',
    tests: [
      ['a**=1;a**=2;a=3;a**4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: '論理積代入 代入演算子 AmpersandAmpersandEqualsToken',
    tests: [
      ['a&&=1;a&&=2;a=3;a&&4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: '論理和代入 代入演算子 BarBarEqualsToken',
    tests: [
      ['a||=1;a||=2;a=3;a||4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: 'Null 合体代入 代入演算子 QuestionQuestionEqualsToken',
    tests: [
      ['a??=1;a??=2;a=3;a??4', { operatorsTotal: 4, operatorsUnique: 3 }],
    ],
  },
  {
    perspective: '分割代入 代入演算子 DotDotDotToken',
    tests: [
      [
        'const [a,b]=[10,20];let [c,d]=[10,20];[c,d]=[10,20];',
        { operatorsTotal: 3, operatorsUnique: 3 },
      ],
      [
        // 分割代入は DotDotDotToken だが SpreadElement は同じ演算子としてカウントする
        'let [a,...rest]=[1,2,3];[a,...rest]=[3,4,5];',
        { operatorsTotal: 4, operatorsUnique: 3 },
      ],
    ],
  },
  {
    perspective: 'スプレッド構文 SpreadElement',
    tests: [
      [
        'const a=[10,20]; const b = [0, ...a];console.log(...b);',
        { operatorsTotal: 4, operatorsUnique: 2 },
      ],
      ['[a,...rest]=[3,4,5];', { operatorsTotal: 2, operatorsUnique: 2 }],
    ],
  },
  {
    perspective: 'yield 演算子 YieldExpression',
    tests: [['yield 1; yield 2;', { operatorsTotal: 2, operatorsUnique: 1 }]],
  },
  {
    // yield と yield* は同じ演算子としてカウントする
    perspective: 'yield* 演算子 YieldExpression',
    tests: [
      [
        // 乗算、ジェネレータ関数、yield* それぞれの * の見分けがつきにくいのでデグレ注意
        // ジェネレータ関数、yield* はアスタリスクをカウントしないようにしている
        'function* func1(){yield 42;}function* func2(){2*3;yield* 4*func1();}',
        { operatorsTotal: 4, operatorsUnique: 2 },
      ],
    ],
  },
  {
    perspective: 'カンマ演算子 YieldExpression',
    tests: [
      [
        'let x=1;x=(x++,x);([1,2],{a:1,b:2},x)',
        { operatorsTotal: 6, operatorsUnique: 4 },
      ],
    ],
  },
] satisfies OperatorTest[])('$perspective', ({ perspective, tests }) => {
  test.each(tests)(`${perspective} %s`, (sourceCode, expected) => {
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
});

test.skip.each([
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
