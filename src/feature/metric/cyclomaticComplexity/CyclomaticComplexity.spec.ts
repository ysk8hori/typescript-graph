import { test, expect } from 'vitest';
import AstLogger from '../../util/AstLogger';
import * as ts from 'typescript';
import AstTraverser from '../../util/AstTraverser';
import { createCyclomaticComplexityAnalyzer } from '.';

interface OperatorTest {
  perspective: string;
  tests: [string, number];
}

test.each([
  {
    perspective: '? の区別',
    tests: ['a ? b : c?.d(e ?? f)', 4],
  },
  {
    perspective: 'オプショナルチェーン',
    tests: ['const x = a.b.c.x?.y?.z?.foo', 4],
  },
  {
    perspective: 'オプショナルチェーンからのプロパティアクセス',
    tests: ['a?.b?.c.d', 3],
  },
  {
    perspective: 'Null 合体演算子 バイナリー論理演算子 QuestionQuestionToken',
    tests: ['true ?? true; true ?? false ?? true', 4],
  },
  {
    perspective: 'Null 合体代入',
    tests: ['a??=1;a??=2;a=3;', 3],
  },
  {
    perspective: '論理和代入',
    tests: ['a||=1;a||=2;a=3', 3],
  },
  {
    perspective: 'if else 文',
    tests: ['if(x){1;}else if(y){2;}else{3;}', 3],
  },
  {
    perspective: 'switch 文',
    tests: ['switch(x){case 1:1;break;case 2:2;break;default:3;}', 3],
  },
  {
    perspective: 'for ループ',
    tests: ['for(let i=0;i<5;i++){if(i===3){continue;}console.log(i);}', 3],
  },
  {
    perspective: 'for...in ループ',
    tests: ['for(const prop in obj){console.log(`${prop}:${obj[prop]}`);}', 2],
  },
  {
    perspective: 'while ループ',
    tests: ['let i=0;while(i<5){console.log(i);i++;}', 2],
  },
  {
    perspective: 'do...while ループ',
    tests: ['let i=0;do{console.log(i);i++;}while(i<5);', 2],
  },
  {
    perspective: 'for await...of ループ',
    tests: [
      'for await(const element of asyncIterable){console.log(element);}',
      2,
    ],
  },
  {
    perspective: 'try...catch',
    tests: ['try{throw new Error("");}catch(e){e;}finally{1;}', 2],
  },
  {
    perspective: 'ラベル',
    tests: [
      'outer:for(let i=0;i<5;i++){inner:for(let j=0;j<5;j++){if(i===j){if(i===4){break outer;}else{continue outer;}}}}',
      5,
    ],
  },
  {
    perspective: 'Conditional Type',
    tests: ['type A <T>= T extends U ? X : Y;', 2],
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
    const volume = createCyclomaticComplexityAnalyzer('sample.tsx');
    const astTraverser = new AstTraverser(source, [astLogger, volume]);
    astTraverser.traverse();
    console.log(astLogger.log);
    expect(volume.metrics.score).toEqual(expected);
  },
);
