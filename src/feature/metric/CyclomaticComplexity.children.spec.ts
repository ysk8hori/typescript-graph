import { test, expect } from 'vitest';
import AstLogger from './AstLogger';
import * as ts from 'typescript';
import AstTraverser from './AstTraverser';
import CyclomaticComplexityForSourceCode from './CyclomaticComplexityForSourceCode';
import { CyclomaticComplexityMetrics } from './CyclomaticComplexity';

type OperatorTest = {
  perspective: string;
  tests: [string, CyclomaticComplexityMetrics];
};

test.each([
  {
    perspective: '全体のスコアとトップレベルの関数のスコアを計測できる',
    tests: [
      `function x() { if(z) {} } function y() { if(z) {} if(z) {} }`,
      {
        name: 'sample.tsx',
        score: 4,
        scope: 'file',
        children: [
          {
            name: 'x',
            score: 2,
            scope: 'function',
          },
          {
            name: 'y',
            score: 3,
            scope: 'function',
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
        score: 4,
        scope: 'file',
        children: [
          {
            name: 'x',
            score: 2,
            scope: 'function',
          },
          {
            name: 'y',
            score: 3,
            scope: 'function',
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
        score: 4,
        scope: 'file',
        children: [
          {
            name: 'anonymous function',
            score: 2,
            scope: 'function',
          },
          {
            name: 'y',
            score: 3,
            scope: 'function',
          },
        ],
      },
    ],
  },
  {
    perspective:
      '全体のスコアとトップレベルのクラスとそのメソッドのスコアを計測できる',
    tests: [
      `
class X {
  constructor() {
    if (z) {
    }
  }
  method() {
    if (z) {
    }
  }
  #a() {
    if (z) {
    }
  }
  private privateMethod() {
    if (z) {
    }
  }
  public publicMethod() {
    if (z) {
    }
  }
  get b() {
    if (z) {
    }
    if (z) {
    }
    return true;
  }
  set b(value: boolean) {
    if (z) {
    }
  }
}
const y = () => {
  if (z) {
  }
  if (z) {
  }
};
      `,
      {
        name: 'sample.tsx',
        score: 11,
        scope: 'file',
        children: [
          {
            name: 'X',
            score: 9,
            scope: 'class',
            children: [
              {
                name: 'constructor',
                score: 2,
                scope: 'method',
              },
              {
                name: 'method',
                score: 2,
                scope: 'method',
              },
              {
                name: '#a',
                score: 2,
                scope: 'method',
              },
              {
                name: 'privateMethod',
                score: 2,
                scope: 'method',
              },
              {
                name: 'publicMethod',
                score: 2,
                scope: 'method',
              },
              {
                name: 'get b',
                score: 3,
                scope: 'method',
              },
              {
                name: 'set b',
                score: 2,
                scope: 'method',
              },
            ],
          },
          {
            name: 'y',
            score: 3,
            scope: 'function',
          },
        ],
      },
    ],
  },
  {
    perspective: '全体のスコアとトップレベルのオブジェクトのスコアを計測できる',
    tests: [
      `function x() { if(z) {} } const y = {z:() => { if(z) {} if(z) {} }};`,
      {
        name: 'sample.tsx',
        score: 4,
        scope: 'file',
        children: [
          {
            name: 'x',
            score: 2,
            scope: 'function',
          },
          {
            name: 'y',
            score: 3,
            scope: 'object',
          },
        ],
      },
    ],
  },
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
    const cyclomaticComplexity = new CyclomaticComplexityForSourceCode(
      'sample.tsx',
    );
    const astTraverser = new AstTraverser(source, [
      astLogger,
      cyclomaticComplexity,
    ]);
    astTraverser.traverse();
    console.log(astLogger.log);
    expect(cyclomaticComplexity.metrics).toEqual(expected);
  },
);
