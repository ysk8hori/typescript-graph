import { test, expect } from 'vitest';
import AstLogger from '../AstLogger';
import * as ts from 'typescript';
import AstTraverser from '../AstTraverser';
import { readFileSync } from 'fs';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
import { createCognitiveComplexityAnalyzer } from '../cognitiveComplexity';

type OperatorTest = {
  perspective: string;
  tests: [string, number];
};

test.each([
  {
    perspective: 'オプショナルチェーン',
    tests: ['const x = x?.y?.z?.foo', 0],
  },
  {
    perspective: 'Null 合体演算子 QuestionQuestionToken',
    tests: ['true ?? true; true ?? false ?? true', 0],
  },
  {
    perspective: 'Null 合体代入',
    tests: ['a??=1;a??=2;a=3;', 0],
  },
  {
    perspective: '論理和代入',
    tests: ['a||=1;a||=2;a=3', 0],
  },
  {
    perspective: 'if...else if',
    tests: ['if(x){1;}else if(y){2;}else{3;}', 3],
  },
  {
    perspective: 'if の入れ子',
    tests: ['if(x){if(y){2;}}', 3],
  },
  {
    perspective: 'if の入れ子に else',
    tests: ['if(x){if(y){2;}else{}}', 4],
  },
  {
    perspective: 'if の入れ子に else if',
    tests: ['if(x){if(y){2;}else if(z){}else{}}', 5],
  },
  {
    perspective: 'switch 文',
    tests: ['switch(x){case 1:1;break;case 2:2;break;default:3;}', 1],
  },
  {
    perspective: 'case の中に if 文',
    tests: [
      `
switch (x) { // +1 nest++
  case 1:
    if (y) { // +2 nest++
    } // nest--
    break;
  case 2:
    2;
    break;
  default:
    3;
} // nest--
      `,
      3,
    ],
  },
  {
    perspective: 'case の中に switch 文',
    tests: [
      `
switch (x) {
  case 1:
    switch (y) {
      case 1:
        1;
        break;
    }
    break;
  case 2:
    2;
    break;
  default:
    3;
}
      `,
      3,
    ],
  },
  {
    perspective: 'for ループ',
    tests: ['for(let i=0;i<5;i++){if(i===3){continue;}}', 3],
  },
  {
    perspective: 'for...in ループ',
    tests: ['for(const prop in obj){if(i===3){continue;}}', 3],
  },
  {
    perspective: 'while ループ',
    tests: ['let i=0;while(i<5){i++;if(i===3){break;}}', 3],
  },
  {
    perspective: 'do...while ループ',
    tests: ['let i=0;do{i++;if(i===3){break;}}while(i<5);', 3],
  },
  {
    perspective: 'for await...of ループ',
    tests: [
      'for await(const element of asyncIterable){if(element){break;}}',
      3,
    ],
  },
  {
    perspective: 'try...catch',
    tests: [
      `
try {
  if (x) { // +1 nest++
    throw new Error('');
  } // nest--
} catch (e) { // +1 nest++
  if (x) { // +2 nest++
    return;
  } // nest--
} finally { // nest--
  if (x) { // +1 nest++
    return;
  }
}`,
      5,
    ],
  },
  {
    perspective: 'ラベルはインクリメント対象とする',
    tests: [
      `
outer: for (let i = 0; i < 5; i++) { // +1 nest++
  inner: for (let j = 0; j < 5; j++) { // +2 nest++
    if (i === j) { // +3 nest++
      if (i === 4) { // +4 nest++
        break outer; // +1
      } else {
        continue outer; // +1
      }
    }
  }
}
`,
      13,
    ],
  },
  {
    perspective: 'Conditional Type',
    tests: [
      'type A<T, Y> = T extends U ? X : Y extends string ? true : false;',
      3,
    ],
  },
  {
    perspective:
      'Conditional Expression の項はネストレベルが上がる（1番目の項の場合）',
    tests: ['const x = a ? b ? c : d : e;', 3],
  },
  {
    perspective:
      'Conditional Expression の項はネストレベルが上がる（2番目の項の場合）',
    tests: ['const x = a ? b : c ? d : e;', 3],
  },
  {
    perspective: 'if の condition に三項演算子',
    tests: [
      'if (true && true && (true ? true ? true : false : false) && true) {1}',
      7,
    ],
  },
  {
    perspective: 'if の condition に三項演算子（論理和）',
    tests: [
      'if (true || true || (true ? true ? true : false : false) || true) {1}',
      7,
    ],
  },
  {
    perspective: '論理積の連続',
    tests: [
      `
      if (a === 0 && a <= 0 && 0 <= a && (d && e)) {
        1;
      }`,
      // `
      // if (a            // +1 for "if"
      //   && a < 0 && 0 < a      // +1
      //   && (d && e))   // カッコで括られた中に論理積があればさらに +1する。カッコがなくても同じ結果になるがそこまで考慮できない。
      // {
      //   1;
      // }`,
      3,
    ],
  },
  {
    perspective: '論理和の連続',
    tests: [
      `
      if (a === 0 || a <= 0 || 0 <= a || (d || e)) {
        1;
      }`,
      // `
      // if (a            // +1 for "if"
      //   || a < 0 || 0 < a      // +1
      //   || (d || e))   // カッコで括られた中に論理和があればさらに +1する。カッコがなくても同じ結果になるがそこまで考慮できない。
      // {
      //   1;
      // }`,
      3,
    ],
  },
  {
    perspective: '論理積の連続',
    tests: [
      `
  if (a // +1 for "if"
    && b && c // +1
    || d || e // +1
    && f) // +1
  {
    1;
  }`,
      4,
    ],
  },
  {
    perspective: 'else および else if はネストレベルに関係なく +1 その１',
    tests: [
      `if (1) if (1) return; if (1) {if(2){}} else if (1) {return};`,
      //       `
      // if (w) {
      //   if (x) {
      //     x
      //   } else if (y) {
      //     y
      //   } else {
      //     z
      //   }
      // }`,
      7,
    ],
  },
  {
    perspective: 'else および else if はネストレベルに関係なく +1 その２',
    tests: [
      `if (w) { if (x) { x } else if (y) { y } else { z }}`,
      //       `
      // if (w) {
      //   if (x) {
      //     x
      //   } else if (y) {
      //     y
      //   } else {
      //     z
      //   }
      // }`,
      5,
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
    const analyzer = createCognitiveComplexityAnalyzer('sample.tsx');
    const astTraverser = new AstTraverser(source, [astLogger, analyzer]);
    astTraverser.traverse();
    console.log(astLogger.log);
    expect(analyzer.metrics.score).toEqual(expected);
  },
);
