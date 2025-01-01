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
        score: 10,
        children: [
          {
            name: 'X',
            score: 8,
            children: [
              {
                name: 'constructor',
                score: 1,
              },
              {
                name: 'method',
                score: 1,
              },
              {
                name: '#a',
                score: 1,
              },
              {
                name: 'privateMethod',
                score: 1,
              },
              {
                name: 'publicMethod',
                score: 1,
              },
              {
                name: 'get b',
                score: 2,
              },
              {
                name: 'set b',
                score: 1,
              },
            ],
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
    perspective: '全体のスコアとトップレベルのオブジェクトのスコアを計測できる',
    tests: [
      `function x() { if(z) {} } const y = {z:() => { if(z) {} if(z) {} }};`,
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
    perspective: '関数を返すトップレベルの関数のスコアを計測できる',
    tests: [
      `function a():()=>void { return () => { if(z) {} }; }`,
      {
        name: 'sample.tsx',
        score: 2,
        children: [
          {
            name: 'a',
            score: 2,
          },
        ],
      },
    ],
  },
  {
    perspective: '関数を返すトップレベルのアロー関数のスコアを計測できる',
    tests: [
      `const a:()=>()=>void=()=>()=>{if(z){}}`,
      {
        name: 'sample.tsx',
        score: 2,
        children: [
          {
            name: 'a',
            score: 2,
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
