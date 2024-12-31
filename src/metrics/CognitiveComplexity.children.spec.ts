import { test, expect } from 'vitest';
import AstLogger from './AstLogger';
import * as ts from 'typescript';
import AstTraverser from './AstTraverser';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
import { CognitiveComplexityMetrics } from './CognitiveComplexity';

type OperatorTest = {
  perspective: string;
  tests: [string, CognitiveComplexityMetrics];
};

test.each([
  {
    perspective: '全体のスコアとトップレベルの関数のスコアを計測できる',
    tests: [
      `function x() { if(z) {} } function y() { if(z) {} if(z) {} }`,
      {
        name: 'sample.tsx',
        score: 3,
        children: [
          {
            name: 'x',
            score: 1,
          },
          {
            name: 'y',
            score: 2,
          },
        ],
      },
    ],
  },
  {
    perspective: '全体のスコアとトップレベルのアロー関数のスコアを計測できる',
    tests: [
      `function x() { if(z) {} } const y = () => { if(z) {} if(z) {} };`,
      {
        name: 'sample.tsx',
        score: 3,
        children: [
          {
            name: 'x',
            score: 1,
          },
          {
            name: 'y',
            score: 2,
          },
        ],
      },
    ],
  },
  {
    perspective: '全体のスコアとトップレベルの無名関数のスコアを計測できる',
    tests: [
      `(function () { if(z) {} })() const y = () => { if(z) {} if(z) {} };`,
      {
        name: 'sample.tsx',
        score: 3,
        children: [
          {
            name: 'anonymous function',
            score: 1,
          },
          {
            name: 'y',
            score: 2,
          },
        ],
      },
    ],
  },
  // {
  //   perspective:
  //     'トップレベルの無名関数定義はネストレベルをインクリメントしない',
  //   tests: [`(function() { if(z) {} })()`, 1],
  // },
  //   {
  //     perspective:
  //       'トップレベルではないオブジェクトはネストレベルをインクリメントする、オブジェクトのプロパティに定義された関数はネストレベルをインクリメントしない',
  //     tests: [
  //       `
  // const obj = {
  //   obj2: {
  //     x: function () {
  //       if (true) {
  //       }
  //     },
  //     y() {
  //       if (true) {
  //       }
  //     },
  //     z: () => {
  //       if (true) {
  //       }
  //     },
  //   }
  // };
  //       `,
  //       6,
  //     ],
  //   },
  //   {
  //     perspective:
  //       '',
  //     tests: [
  //       `
  // class A {
  //   method() {
  //     class A2 {
  //       constructor() {
  //         if (true) {}
  //       }
  //     }
  //   }
  // }
  // class B {
  //   method() {
  //     if (true) {}
  //     if (true) {}
  //   }
  // }
  //       `,
  //       2,
  //     ],
  //   },
] satisfies OperatorTest[])(
  `$perspective`,
  ({ tests: [sourceCode, expected] }) => {
    const source = ts.createSourceFile(
      'sample.tsx',
      sourceCode,
      ts.ScriptTarget.ESNext,
      // parent を使うことがあるので true
      true,
      ts.ScriptKind.TS,
    );
    const astLogger = new AstLogger();
    const cognitiveComplexity = new CognitiveComplexityForSourceCode(
      'sample.tsx',
    );
    const astTraverser = new AstTraverser(source, [
      astLogger,
      cognitiveComplexity,
    ]);
    astTraverser.traverse();
    console.log(astLogger.log);
    expect(cognitiveComplexity.metrics).toMatchObject(expected);
  },
);
